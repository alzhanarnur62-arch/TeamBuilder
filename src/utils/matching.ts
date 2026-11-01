import { Match, Project, Role, Student } from '../types';
import { t, roleName, slotsText } from '../i18n';

/*
 * Команда құру алгоритмі.
 *
 * 1. Әр студентке жеке балл береміз (рөл, дағды, уақыт, қызығушылық).
 * 2. Ең үміттілерін (12 адамға дейін) алып, бос орындарға барлық мүмкін
 *    құрамдарды тексереміз — тек «ең мықтыны бір-бірден» емес.
 * 3. Әр құрамды тұтас бағалаймыз: рөлдер теңгерімі, дағдыларды жабу,
 *    бәріне ортақ бос уақыт, қызығушылық. Басқа жобада бос емес адамға айып.
 * 4. Ең жақсы 3 нұсқаны береміз және әр шешімді түсіндіреміз:
 *    неге таңдалды, онсыз балл қанша түседі, неге басқалар таңдалмады.
 */

const norm = (x: string) => x.trim().toLowerCase();
const has = (list: string[], x: string) => list.some((y) => norm(y) === norm(x));
const overlap = (a: string[], b: string[]) => a.filter((x) => has(b, x));
const uniq = <T,>(a: T[]) => Array.from(new Set(a));

const WEIGHTS = { roles: 0.35, skills: 0.3, time: 0.25, interests: 0.1 };
const BUSY_PENALTY = 0.08;
const POOL_SIZE = 12;

/** studentId → ол қазір мүше болып тұрған басқа жобалардың атаулары */
export type Busy = Record<string, string[]>;

export type Breakdown = { roles: number; skills: number; time: number; interests: number | null };

export type TeamMember = {
  student: Student;
  /** Жетекші немесе өтінімі бұрын қабылданған — алгоритм оны ауыстырмайды */
  fixed: boolean;
  /** Онсыз команда балы қаншаға төмендейді */
  contribution: number;
  reasons: string[];
  warnings: string[];
};

export type TeamVariant = {
  members: TeamMember[];
  score: number;
  breakdown: Breakdown;
  missingRoles: Role[];
  missingSkills: string[];
  commonSlots: string[];
  summary: string[];
  /** 1-нұсқадан айырмашылығы, мысалы «Мерей → Әсем» */
  diff: string | null;
};

export type Rejection = { student: Student; reasons: string[] };

export type TeamResult = {
  variants: TeamVariant[];
  rejected: Rejection[];
  /** Қанша құрам тексерілді — экранда көрсетеміз */
  checked: number;
  /** Бос орын жоқ (команда толық) */
  full: boolean;
};

/* ---------- Жеке балл (жобалар тізіміндегі «Сізге сәйкестігі» үшін де) ---------- */

export function scoreStudent(
  project: Project,
  s: Student,
  filledRoles: Role[] = [],
  coveredSkills: string[] = [],
): Match {
  const skillHits = overlap(project.neededSkills, s.skills);
  const newSkillHits = skillHits.filter((x) => !has(coveredSkills, x));
  const timeHits = overlap(project.slots, s.freeSlots);
  const interestList = project.interests ?? [];
  const interestHits = overlap(interestList, s.interests);
  const roleNeeded = project.neededRoles.includes(s.role) && !filledRoles.includes(s.role);

  const parts = [
    { w: 0.4, v: project.neededSkills.length ? newSkillHits.length / project.neededSkills.length : 0 },
    { w: 0.25, v: roleNeeded ? 1 : 0 },
    { w: 0.2, v: project.slots.length ? timeHits.length / project.slots.length : 0 },
  ];
  if (interestList.length) parts.push({ w: 0.15, v: interestHits.length / interestList.length });
  const totalW = parts.reduce((a, p) => a + p.w, 0);
  const score = Math.round((parts.reduce((a, p) => a + p.w * p.v, 0) / totalW) * 100);

  return { student: s, score, reasons: [] };
}

/* ---------- Команданы тұтас бағалау ---------- */

function commonSlotsOf(project: Project, members: Student[]): string[] {
  const base = project.slots.length ? project.slots : uniq(members.flatMap((m) => m.freeSlots));
  return base.filter((slot) => members.every((m) => has(m.freeSlots, slot)));
}

function evaluate(project: Project, members: Student[], busy: Busy) {
  const neededRoles = uniq(project.neededRoles);
  const roles = members.map((m) => m.role);
  const coveredRoles = neededRoles.filter((r) => roles.includes(r));
  const roleCoverage = neededRoles.length ? coveredRoles.length / neededRoles.length : 1;
  const roleVariety = members.length ? uniq(roles).length / members.length : 1;
  const rolesScore = 0.75 * roleCoverage + 0.25 * roleVariety;

  const allSkills = members.flatMap((m) => m.skills);
  const coveredSkills = project.neededSkills.filter((x) => has(allSkills, x));
  const skillsScore = project.neededSkills.length ? coveredSkills.length / project.neededSkills.length : 1;

  const common = commonSlotsOf(project, members);
  let timeScore: number;
  if (common.length > 0) {
    const base = project.slots.length || common.length;
    timeScore = 0.6 + 0.4 * (common.length / base);
  } else if (project.slots.length) {
    // Ортақ уақыт жоқ — әркімнің жобамен қаншалықты сәйкес екенін ғана есептейміз.
    const avg = members.reduce((a, m) => a + overlap(project.slots, m.freeSlots).length / project.slots.length, 0) / members.length;
    timeScore = 0.4 * avg;
  } else {
    timeScore = 0.3;
  }

  const projInterests = project.interests ?? [];
  const interestsScore = projInterests.length
    ? members.reduce((a, m) => a + overlap(projInterests, m.interests).length / projInterests.length, 0) / members.length
    : null;

  const busyCount = members.filter((m) => (busy[m.id] ?? []).length > 0).length;

  const parts: [number, number][] = [
    [WEIGHTS.roles, rolesScore],
    [WEIGHTS.skills, skillsScore],
    [WEIGHTS.time, timeScore],
  ];
  if (interestsScore !== null) parts.push([WEIGHTS.interests, interestsScore]);
  const totalW = parts.reduce((a, [w]) => a + w, 0);
  const raw = parts.reduce((a, [w, v]) => a + w * v, 0) / totalW - busyCount * BUSY_PENALTY;
  const score = Math.max(0, Math.min(100, Math.round(raw * 100)));

  return {
    score,
    breakdown: { roles: rolesScore, skills: skillsScore, time: timeScore, interests: interestsScore },
    missingRoles: neededRoles.filter((r) => !roles.includes(r)),
    missingSkills: project.neededSkills.filter((x) => !has(allSkills, x)),
    commonSlots: common,
  };
}

/* ---------- Комбинацияларды аралау ---------- */

function combinations<T>(items: T[], k: number): T[][] {
  const out: T[][] = [];
  const pick: T[] = [];
  const walk = (start: number) => {
    if (pick.length === k) {
      out.push([...pick]);
      return;
    }
    for (let i = start; i <= items.length - (k - pick.length); i++) {
      pick.push(items[i]);
      walk(i + 1);
      pick.pop();
    }
  };
  if (k === 0) return [[]];
  walk(0);
  return out;
}

/* ---------- Түсіндірмелер ---------- */

function explainMember(
  project: Project,
  m: Student,
  team: Student[],
  fixedNote: string | null,
  fullScore: number,
  busy: Busy,
): TeamMember {
  const others = team.filter((x) => x.id !== m.id);
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (fixedNote) reasons.push(fixedNote);

  const roleNeeded = project.neededRoles.includes(m.role);
  const sameRole = others.filter((x) => x.role === m.role);
  if (roleNeeded && sameRole.length === 0) reasons.push(t('m.onlyRole', { role: roleName(m.role) }));
  else if (roleNeeded) warnings.push(t('m.dupRole', { role: roleName(m.role), names: sameRole.map((x) => x.name).join(', ') }));
  else if (!fixedNote) warnings.push(t('m.roleNotNeeded', { role: roleName(m.role) }));

  const othersSkills = others.flatMap((x) => x.skills);
  const mine = overlap(project.neededSkills, m.skills);
  const onlyMine = mine.filter((x) => !has(othersSkills, x));
  if (onlyMine.length) reasons.push(t('m.uniqueSkills', { list: onlyMine.join(', ') }));
  else if (mine.length) reasons.push(t('m.hasSkills', { list: mine.join(', ') }));

  const time = overlap(project.slots, m.freeSlots);
  if (time.length) reasons.push(t('m.timeFits', { slots: slotsText(time) }));
  else if (project.slots.length) warnings.push(t('m.timeNo'));

  const ints = overlap(project.interests ?? [], m.interests);
  if (ints.length) reasons.push(t('m.interests', { list: ints.join(', ') }));

  const busyIn = busy[m.id] ?? [];
  if (busyIn.length && !fixedNote) warnings.push(t('m.busy', { projects: busyIn.join('», «') }));

  const without = others.length ? evaluate(project, others, busy).score : 0;
  const contribution = Math.max(0, fullScore - without);
  if (!fixedNote && contribution > 0) reasons.push(t('m.contribution', { n: contribution }));

  return { student: m, fixed: !!fixedNote, contribution, reasons, warnings };
}

function explainRejection(
  project: Project,
  cand: Student,
  variants: TeamVariant[],
  seats: number,
  busy: Busy,
): Rejection {
  const best = variants[0];
  const team = best.members.map((x) => x.student);
  const reasons: string[] = [];

  const busyIn = busy[cand.id] ?? [];
  if (busyIn.length) reasons.push(t('m.busy', { projects: busyIn.join('», «') }));

  if (!project.neededRoles.includes(cand.role)) {
    reasons.push(t('r.roleNotNeeded', { role: roleName(cand.role) }));
  } else {
    const holder = team.find((x) => x.role === cand.role);
    if (holder) reasons.push(t('r.roleTaken', { role: roleName(cand.role), name: holder.name }));
    else {
      const needed = uniq(project.neededRoles).length;
      reasons.push(t('r.noSeats', { role: roleName(cand.role), seats, needed }));
    }
  }

  const teamSkills = team.flatMap((x) => x.skills);
  const newSkills = overlap(project.neededSkills, cand.skills).filter((x) => !has(teamSkills, x));
  if (newSkills.length === 0) reasons.push(t('r.noNewSkills'));

  if (best.commonSlots.length && !best.commonSlots.some((slot) => has(cand.freeSlots, slot))) {
    reasons.push(t('r.timeNo', { slots: slotsText(best.commonSlots) }));
  }

  // Ең жақсы алмастыруды тексереміз: оны біреудің орнына қойсақ балл қандай болар еді?
  let bestSwap: { name: string; score: number } | null = null;
  for (const mem of best.members) {
    if (mem.fixed) continue;
    const swapped = team.map((x) => (x.id === mem.student.id ? cand : x));
    const sc = evaluate(project, swapped, busy).score;
    if (!bestSwap || sc > bestSwap.score) bestSwap = { name: mem.student.name, score: sc };
  }
  if (bestSwap) {
    if (bestSwap.score >= best.score) {
      reasons.push(t('r.swapTie', { name: bestSwap.name, score: bestSwap.score }));
    } else {
      reasons.push(t('r.swapWorse', { name: bestSwap.name, a: best.score, b: bestSwap.score }));
    }
  }

  const inOther = variants.findIndex((v, i) => i > 0 && v.members.some((m) => m.student.id === cand.id));
  if (inOther > 0) reasons.push(t('r.inVariant', { n: inOther + 1 }));

  return { student: cand, reasons };
}

function summarize(v: ReturnType<typeof evaluate>, members: Student[]): string[] {
  const lines: string[] = [];
  lines.push(
    v.missingRoles.length ? t('s.missingRoles', { list: v.missingRoles.map(roleName).join(', ') }) : t('s.allRoles'),
  );
  lines.push(
    v.missingSkills.length ? t('s.missingSkills', { list: v.missingSkills.join(', ') }) : t('s.allSkills'),
  );
  lines.push(
    v.commonSlots.length
      ? t('s.common', { slots: slotsText(v.commonSlots) })
      : t('s.noCommon'),
  );
  const dup = members.length - uniq(members.map((m) => m.role)).length;
  if (dup > 0) lines.push(t('s.dup', { n: dup }));
  return lines;
}

/* ---------- Негізгі функция ---------- */

export function buildTeam(
  project: Project,
  students: Student[],
  opts: { acceptedIds?: string[]; busy?: Busy } = {},
): TeamResult {
  const busy = opts.busy ?? {};
  const owner = students.find((s) => s.id === project.ownerId);
  const accepted = (opts.acceptedIds ?? [])
    .map((id) => students.find((s) => s.id === id))
    .filter((s): s is Student => !!s);
  const fixed = [...(owner ? [owner] : []), ...accepted];
  const fixedIds = new Set(fixed.map((s) => s.id));

  const seats = Math.max(project.teamSize - fixed.length, 0);

  const fixedRoles = fixed.map((s) => s.role);
  const fixedSkills = overlap(project.neededSkills, fixed.flatMap((s) => s.skills));
  const pool = students
    .filter((s) => !fixedIds.has(s.id))
    .map((s) => {
      const m = scoreStudent(project, s, fixedRoles, fixedSkills);
      const penalty = (busy[s.id] ?? []).length ? 15 : 0;
      return { s, rank: m.score - penalty };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, POOL_SIZE)
    .map((x) => x.s);

  const k = Math.min(seats, pool.length);
  const combos = combinations(pool, k);

  const indiv = new Map(pool.map((s) => [s.id, scoreStudent(project, s, fixedRoles, fixedSkills).score]));
  const scored = combos
    .map((extra) => {
      const members = [...fixed, ...extra];
      const tie = extra.reduce((a, s) => a + (indiv.get(s.id) ?? 0), 0);
      return { members, extra, tie, ev: evaluate(project, members, busy) };
    })
    // Балл тең болса — жеке сәйкестігі жоғары адамдар бар құрам алда.
    .sort((a, b) => b.ev.score - a.ev.score || b.tie - a.tie);

  const fixedNote = (s: Student) =>
    s.id === project.ownerId ? t('m.leader') : fixedIds.has(s.id) ? t('m.accepted') : null;

  const variants: TeamVariant[] = scored.slice(0, 3).map(({ members, ev }) => ({
    members: members.map((m) => explainMember(project, m, members, fixedNote(m), ev.score, busy)),
    score: ev.score,
    breakdown: ev.breakdown,
    missingRoles: ev.missingRoles,
    missingSkills: ev.missingSkills,
    commonSlots: ev.commonSlots,
    summary: summarize(ev, members),
    diff: null,
  }));

  const first = variants[0];
  variants.slice(1).forEach((v) => {
    const a = first.members.map((m) => m.student);
    const b = v.members.map((m) => m.student);
    const out = a.filter((x) => !b.some((y) => y.id === x.id)).map((x) => x.name);
    const inn = b.filter((x) => !a.some((y) => y.id === x.id)).map((x) => `${x.name} (${roleName(x.role)})`);
    v.diff = t('v.diff', { out: out.join(', '), in: inn.join(', ') });
  });

  const best = variants[0];
  const chosen = new Set(best ? best.members.map((m) => m.student.id) : []);
  const rejected = best
    ? pool
        .filter((s) => !chosen.has(s.id))
        .slice(0, 5)
        .map((s) => explainRejection(project, s, variants, seats, busy))
    : [];

  return { variants, rejected, checked: combos.length, full: seats === 0 };
}
