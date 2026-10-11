import { PrismaClient, EntrySource, EvidenceKind, EvidencePolarity, PatternStatus } from '@prisma/client';

const prisma = new PrismaClient();

const USER_ID = process.env.MIRROR_USER_ID || 'mirror-owner';
const ids = {
  entryFocus: 'seed-entry-focus',
  entryExecution: 'seed-entry-execution',
  goal: 'seed-goal-judgment',
  decision: 'seed-decision-focus',
  commitment: 'seed-commitment-review',
  evidenceSupport: 'seed-evidence-support',
  evidenceCounter: 'seed-evidence-counter',
  pattern: 'seed-pattern-execution-gap',
};

async function main() {
  await prisma.user.upsert({
    where: { id: USER_ID },
    update: {},
    create: { id: USER_ID },
  });

  await prisma.entry.upsert({
    where: { id: ids.entryFocus },
    update: {},
    create: {
      id: ids.entryFocus,
      userId: USER_ID,
      source: EntrySource.SYSTEM,
      rawText: '[SEED TEST DATA] I want MIRROR to improve my judgment by comparing what I say I will do with what actually happens.',
    },
  });

  await prisma.entry.upsert({
    where: { id: ids.entryExecution },
    update: {},
    create: {
      id: ids.entryExecution,
      userId: USER_ID,
      source: EntrySource.SYSTEM,
      rawText: '[SEED TEST DATA] I sometimes start new work before validating whether the previous priority produced the intended result.',
    },
  });

  await prisma.goal.upsert({
    where: { id: ids.goal },
    update: {},
    create: {
      id: ids.goal,
      userId: USER_ID,
      title: '[SEED] Improve decision quality',
      description: 'Use explicit decisions, commitments, evidence, predictions, and reviews instead of relying on memory alone.',
      active: true,
    },
  });

  await prisma.decision.upsert({
    where: { id: ids.decision },
    update: {},
    create: {
      id: ids.decision,
      userId: USER_ID,
      title: '[SEED] Finish one validation loop before adding another major priority',
      reasoning: 'A completed feedback loop produces evidence; starting more work can hide whether the previous decision worked.',
      expectedOutcome: 'More completed experiments and clearer evidence about what works.',
      confidence: 75,
      killCondition: 'Reverse this decision if evidence shows parallel priorities consistently improve completed outcomes.',
    },
  });

  await prisma.commitment.upsert({
    where: { id: ids.commitment },
    update: {},
    create: {
      id: ids.commitment,
      userId: USER_ID,
      statement: '[SEED] Review the current priority and record an outcome before starting another major project.',
    },
  });

  await prisma.evidence.upsert({
    where: { id: ids.evidenceSupport },
    update: {},
    create: {
      id: ids.evidenceSupport,
      userId: USER_ID,
      entryId: ids.entryExecution,
      kind: EvidenceKind.USER_REPORT,
      claim: '[SEED] The user reports sometimes starting new work before validating the previous priority.',
    },
  });

  await prisma.evidence.upsert({
    where: { id: ids.evidenceCounter },
    update: {},
    create: {
      id: ids.evidenceCounter,
      userId: USER_ID,
      entryId: ids.entryFocus,
      kind: EvidenceKind.USER_REPORT,
      claim: '[SEED] The user explicitly wants a system that measures outcomes and improves judgment.',
    },
  });

  await prisma.pattern.upsert({
    where: { id: ids.pattern },
    update: {},
    create: {
      id: ids.pattern,
      userId: USER_ID,
      name: '[SEED] Possible execution-validation gap',
      hypothesis: 'The user may sometimes move to a new priority before collecting enough evidence from the current one.',
      status: PatternStatus.PROPOSED,
    },
  });

  await prisma.patternEvidence.upsert({
    where: { patternId_evidenceId: { patternId: ids.pattern, evidenceId: ids.evidenceSupport } },
    update: { polarity: EvidencePolarity.SUPPORTS },
    create: { patternId: ids.pattern, evidenceId: ids.evidenceSupport, polarity: EvidencePolarity.SUPPORTS },
  });

  await prisma.patternEvidence.upsert({
    where: { patternId_evidenceId: { patternId: ids.pattern, evidenceId: ids.evidenceCounter } },
    update: { polarity: EvidencePolarity.COUNTERS },
    create: { patternId: ids.pattern, evidenceId: ids.evidenceCounter, polarity: EvidencePolarity.COUNTERS },
  });

  await prisma.auditEvent.upsert({
    where: { id: 'seed-audit-bootstrap' },
    update: {},
    create: {
      id: 'seed-audit-bootstrap',
      userId: USER_ID,
      action: 'BOOTSTRAP_SEED',
      entityType: 'User',
      entityId: USER_ID,
      metadata: { synthetic: true, purpose: 'initial end-to-end agent test' },
    },
  });

  console.log(JSON.stringify({
    ok: true,
    userId: USER_ID,
    synthetic: true,
    message: 'MIRROR bootstrap seed is ready. Re-running is safe and does not duplicate records.',
  }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
