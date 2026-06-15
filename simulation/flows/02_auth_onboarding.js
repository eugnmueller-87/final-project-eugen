"use strict";
/**
 * FLOW 2 — Auth & onboarding (operator-provisioned, invite-only).
 *
 * No public signup. The operator creates orgs + admins; admins add members; a
 * one-time set-password link is emailed (Resend). Mirrors the security-definer
 * RPCs (create_org / add_person / set_admin) and the four-layer auth model.
 */

const t = require("../lib/trace");
const fx = require("../lib/fixtures");

// A minimal in-memory directory so we can assert provisioning + isolation.
function makeDirectory() {
  const profiles = new Map();
  const orgs = new Map();
  return {
    orgs,
    profiles,
    // security-definer create_org: only the operator may call.
    createOrg(actor, org) {
      if (actor.role !== "superadmin") throw new Error("only operator can create orgs");
      orgs.set(org.id, org);
      return org;
    },
    // add_person: operator adds an admin; admin adds members in their OWN org only.
    addPerson(actor, person) {
      if (actor.role === "superadmin") {
        // operator may add an admin to any org
      } else if (actor.role === "admin") {
        if (person.orgId !== actor.orgId) throw new Error("admin cannot add to another org");
        if (person.role !== "member") throw new Error("admin cannot mint another admin");
      } else {
        throw new Error("members cannot provision anyone");
      }
      profiles.set(person.id, { ...person, status: "invited" });
      return { emailedSetPasswordLink: fx.SCHEDULE_LINK };
    },
    setPassword(personId) {
      const p = profiles.get(personId);
      if (!p) throw new Error("no such invited profile");
      p.status = "active";
      return p;
    },
  };
}

function run() {
  t.flow("Auth & onboarding", "operator-provisioned, invite-only — no public signup");
  t.resetSteps();
  const dir = makeDirectory();

  // 1. Operator bootstraps + creates an org.
  t.step("Operator login", "bootstrapped from SUPERADMIN_EMAILS → /operator");
  dir.createOrg(fx.people.operator, fx.orgs.sonnenschein);
  t.assert(dir.orgs.has(fx.orgs.sonnenschein.id), "operator created the org via create_org RPC");

  // 2. Operator adds the org's first admin.
  t.step("Operator adds an admin", fx.people.adminS.email);
  const inviteAdmin = dir.addPerson(fx.people.operator, fx.people.adminS);
  t.assert(!!inviteAdmin.emailedSetPasswordLink, "one-time set-password link emailed (Resend)");
  t.assert(dir.profiles.get(fx.people.adminS.id).status === "invited", "admin shows as 'invited' until first login");

  // 3. Admin adds members in their own org.
  t.step("Admin adds members", "/admin/mitglieder");
  dir.addPerson(fx.people.adminS, fx.people.parentOptIn);
  dir.addPerson(fx.people.adminS, fx.people.parentOptOut);
  t.assert(dir.profiles.has(fx.people.parentOptIn.id), "member provisioned");

  // 4. The invite-only guardrails (deny-by-default).
  t.step("Guardrails", "deny-by-default — illegal provisioning is refused");
  let refusedCrossOrg = false;
  try {
    dir.addPerson(fx.people.adminS, { ...fx.people.parentOther, role: "member" });
  } catch (e) {
    refusedCrossOrg = true;
  }
  t.assert(refusedCrossOrg, "admin CANNOT add a member to another org");

  let refusedAdminMint = false;
  try {
    dir.addPerson(fx.people.adminS, { id: "u_x", email: "x@y.de", role: "admin", orgId: fx.orgs.sonnenschein.id });
  } catch (e) {
    refusedAdminMint = true;
  }
  t.assert(refusedAdminMint, "admin CANNOT mint another admin (only the operator can)");

  let refusedMemberProvision = false;
  try {
    dir.addPerson(fx.people.parentOptIn, { id: "u_z", email: "z@y.de", role: "member", orgId: fx.orgs.sonnenschein.id });
  } catch (e) {
    refusedMemberProvision = true;
  }
  t.assert(refusedMemberProvision, "members CANNOT provision anyone");

  // 5. Set-password link establishes a session → /set-password.
  t.step("Member sets password", "invite link → /auth/callback → /set-password (updateUser)");
  const active = dir.setPassword(fx.people.parentOptIn.id);
  t.assert(active.status === "active", "member now active; logs in at /login with email + password");
  t.note("the emailed link carries NO org/role params — nothing escalatable to tamper with");

  return { name: "Auth & onboarding", scenarios: 1, dir };
}

module.exports = { run, makeDirectory };
