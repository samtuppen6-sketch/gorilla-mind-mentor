/**
 * Central Natural Language State Interpreter for the Gorilla Mind coach.
 *
 * Translates raw user language into structured internal state signals
 * BEFORE the coach picks a route (breathwork, workout, meditation, etc.).
 *
 * Pure, side-effect free. Wraps `prescribeBreathwork` to produce a
 * `recommendedBreathworkId` when one is unambiguous.
 */

import type { BreathworkPrescription, BreathworkProtocolId } from "./coach.functions";

export type InterpreterRiskLevel = "low" | "medium" | "high";
export type InterpreterConfidence = "low" | "medium" | "high";

export type RecommendedLane =
  | "breathwork"
  | "daily_minimum_checkin"
  | "workout"
  | "recovery"
  | "sleep"
  | "urge_interrupt"
  | "re_entry"
  | "focus_lock_in";

export type UserStateInterpretation = {
  primaryState: string;
  secondaryStates: string[];
  intent: string;
  bodyState: string;
  mindState: string;
  emotionalTone: string;
  riskLevel: InterpreterRiskLevel;
  recommendedLane: RecommendedLane;
  recommendedBreathworkId?: BreathworkProtocolId;
  confidence: InterpreterConfidence;
  reason: string;
  competingSignals: string[];
  /** True when message is a vague "I don't feel great" with no qualifier.
   *  When true, callers should ASK a clarifying question rather than force a card. */
  clarificationNeeded: boolean;
};

/**
 * Strip clauses where the user explicitly negates a signal word, e.g.
 * "I'm not anxious, just tired" → mark `anxious` as denied so the
 * downstream regex pass won't mis-fire.
 */
const NEGATION_TOKENS = [
  "anxious", "wired", "tired", "stressed", "ashamed", "panicky",
  "overwhelmed", "scattered", "flat", "low", "sore", "drained",
  "heavy", "knackered", "wiped", "great", "good", "fresh", "ready",
  "switched on", "clear", "clear-headed", "sad", "angry",
];

export function buildDeniedSignalSet(message: string): Set<string> {
  const denied = new Set<string>();
  const m = message.toLowerCase();
  const pattern = new RegExp(
    `\\b(?:not|n[o']t|don'?t|never|isn'?t|aren'?t|wasn'?t)\\s+(?:feeling\\s+|feel\\s+)?(${NEGATION_TOKENS.map(t => t.replace(/[-]/g, "[- ]?")).join("|")})\\b`,
    "gi",
  );
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(m)) !== null) {
    denied.add(match[1].replace(/[- ]/g, "-"));
  }
  return denied;
}

/**
 * Detect a vague low-state phrase with no qualifier so we can ask a
 * clarifying question instead of forcing a route.
 */
const VAGUE_LOW_STATE =
  /(don'?t feel (great|good|right|amazing|myself|well|brilliant))|(\bfeel (off|weird|flat|rough|meh|funny|strange)\b)|(\bnot (myself|with it|feeling (great|right|myself|it|good|brilliant|well))\b)|(\bbit (rough|off|low|flat)\b)|(\bstruggling today\b)|(\b(can'?t be bothered|cba|no drive|low mood)\b)/i;

const QUALIFIER_PATTERNS = [
  /\b(anxious|anxiety|wired|on edge|panicky|stressed|heart racing|tense|overwhelmed|can'?t switch off|can'?t sleep|need to calm down)\b/i,
  /\b(urge|craving|relapse|slip|slipping|scroll(ing)?|porn|gambl|drink|drugs?|use|binge|impulse|itchy|old pattern)\b/i,
  /\b(missed (a |two |three |a few |some |several )?day|fell off|fallen off|haven'?t checked in|ashamed|guilt|messed up|back to square one|lost (my standard|momentum)|old me|failed again|need to get back on track|re[- ]?enter)\b/i,
  /\b(sore|soreness|aching|achy|doms|knackered|wiped( out)?|drained|exhausted|smashed|wrecked|legs? (are|feel)? ?(tired|heavy|done|drained|gone)|body (feels|is) (heavy|drained|done)|physically (tired|drained|done|spent)|finished (the |my )?(gym|training|workout|session|lifting)|after (training|workout|gym|session)|sauna|cold (plunge|shower|exposure)|need to recover|body (needs to )?come down)\b/i,
  /\b(head'?s all over|head is fried|can'?t think straight|can'?t focus|scattered|distracted|overthinking|need (clarity|control|to focus|to lock in|to get my head right))\b/i,
  /\b(feel (great|good|fresh|ready|clear|amazing|sharp|switched on|locked in)|clear[- ]?headed|good headspace|slept (well|great|good)|attack the day|want to train|ready to (go|attack))\b/i,
  /\b(walk|walked|walking|hike|hiked)\b/i,
  /\b(morning|tonight|evening|late|bedtime|sleep|before bed|wind ?down)\b/i,
];

function hasAnyQualifier(message: string): boolean {
  return QUALIFIER_PATTERNS.some((re) => re.test(message));
}

/**
 * Coarse intent inference. Used for debug + downstream lane selection.
 */
function inferIntent(message: string): string {
  const m = message.toLowerCase();
  if (/\b(urge|craving|relapse|about to (slip|scroll|use|drink|gamble)|stop( an?)? urge|itchy|impulse)\b/.test(m)) return "stop_an_urge";
  if (/\b(can'?t sleep|need sleep|before bed|wind ?down|switch off|can'?t switch off|come down mentally)\b/.test(m)) return "calm_down";
  if (/\b(anxious|wired|stressed|panicky|overwhelmed|on edge|heart racing|tense)\b/.test(m)) return "calm_down";
  if (/\b(recover|recovery|come down|sore|knackered|wiped|drained|legs are tired|body is heavy)\b/.test(m)) return "recover";
  if (/\b(fallen off|fell off|missed (a|two|three|a few|some|several) day|back to square one|lost momentum|re[- ]?enter|get back on track)\b/.test(m)) return "get_back_on_track";
  if (/\b(focus|lock in|clarity|control|get my head right|sharp|switched on)\b/.test(m)) return "focus";
  if (/\b(attack the day|fired up|energis|energiz|ready to train|want to train|switch on)\b/.test(m)) return "switch_on";
  if (/\b(plan|programme|program|routine|build a|structure|protocol)\b/.test(m)) return "build_a_plan";
  if (/\b(reset|clear|grounded)\b/.test(m)) return "reset";
  return "unspecified";
}

function inferRisk(message: string, deniedSignals: Set<string>): InterpreterRiskLevel {
  const m = message.toLowerCase();
  if (/\b(urge|craving|relapse|about to (slip|scroll|use|drink|gamble)|panic|panicky|chest pain|can'?t breathe|suicid|self[- ]harm)\b/.test(m)) return "high";
  const anxiousActive = /\b(anxious|wired|stressed|overwhelmed|on edge|heart racing|can'?t sleep)\b/i.test(m) && !deniedSignals.has("anxious") && !deniedSignals.has("wired") && !deniedSignals.has("stressed");
  const shameActive = /\b(ashamed|fell off|fallen off|missed (a|two|three|a few|some|several) day|back to square one|old me|failed again)\b/i.test(m) && !deniedSignals.has("ashamed");
  if (anxiousActive || shameActive) return "medium";
  return "low";
}

/**
 * Produce the structured natural-language interpretation.
 *
 * The breathwork prescription is computed separately by
 * `prescribeBreathwork`; this function only needs the resulting id
 * (or null) to attach `recommendedBreathworkId` for downstream callers.
 */
export function interpretUserState(
  message: string,
  context: {
    prescription: BreathworkPrescription | null;
    dayPart?: string | null;
    localTime?: string | null;
  },
): UserStateInterpretation {
  const m = message ?? "";
  const denied = buildDeniedSignalSet(m);

  // Active signal flags (after negation suppression)
  const has = (re: RegExp, deny?: string) => re.test(m) && !(deny && denied.has(deny));

  const urge = has(/\b(urge|craving|porn|gambl|relapse|binge|compulsi|substance|drink(ing)?|drugs?|want to (use|drink|gamble|scroll)|about to (slip|relapse|use|scroll|gamble|drink)|stuck scrolling|can'?t stop scrolling|old pattern|close to slipping|itchy feeling|impulse)\b/i);
  const scrolling = /\b(scroll(ing)?|phone loop|tiktok|instagram|reels|slipping)\b/i.test(m);
  const anxious = has(/\b(anxious|anxiety|nervous|on edge|panicky|stressed|heart racing|need to calm down|come down mentally)\b/i, "anxious");
  const wired = has(/\b(wired|can'?t switch off|cannot switch off|racing thoughts|tense|overstimulated|can'?t sleep)\b/i, "wired");
  const overwhelmed = has(/\b(overwhelm(ed)?|too much|drowning)\b/i, "overwhelmed");
  const missed = /\b(missed (a |two |three |a few |some |several )?day|fell off|fallen off|haven'?t checked in|haven'?t (done|trained)|back to square one|lost (my standard|momentum)|old me( is back)?|failed again|need to get back on track|re[- ]?enter)\b/i.test(m);
  const shame = has(/\b(shame|ashamed|guilty|guilt|hate myself|loser|pathetic|disgust(ed|ing)|messed up)\b/i, "ashamed");
  const physicalFatigue = has(/\b(sore|soreness|aching|achy|doms|stiff|fatigued|exhausted|smashed|wrecked|knackered|wiped( out)?|drained|legs are done|body is done)\b/i, "tired");
  const bodyHeavy = /\b((legs|body|arms) (are|feel|felt|'?s|is) (tired|heavy|done|drained|sore|wrecked|smashed|knackered|gone)|heavy legs|tired legs|physically (drained|tired|done|spent))\b/i.test(m);
  const postTraining = /\b(after (training|workout|gym|session|lifting)|post[- ]training|just trained|finished (training|the (gym|workout|session)|my (gym|workout|session|lift)|lifting)|done (training|the gym|my workout|my session|lifting))\b/i.test(m);
  const postWalk = /\b(after (my |the |a )?walk|finished (my |the |a )?walk|been for a walk|went for a walk|got back from (a |my |the )?walk|back from (a |my |the )?walk|just walked|walked for|out walking|had a walk)\b/i.test(m);
  const scattered = /\b(scattered|unfocused|distracted|can'?t focus|head'?s all over|head is all over|head is fried|can'?t think straight|overthinking|all over the place|need (clarity|control|to focus|to lock in|to get my head right))\b/i.test(m);
  const flat = has(/\b(flat|sluggish|foggy|brain fog|tired|low energy|drained|heavy|low mood|no drive|can'?t be bothered|cba|bit rough)\b/i, "tired");
  const energised = has(/\b(energis(ed|ing)|energiz(ed|ing)|attack the day|slept (great|well|good)|feel(ing)? (great|strong|amazing|fresh|ready|sharp|switched on|locked in)|ready to (go|attack|train)|fired up|want to train|want to move)\b/i, "great");
  const positiveAfterWalk = postWalk && !anxious && !wired && !urge;

  // Decide primary state with the same priority as the breathwork router.
  let primaryState = "unknown";
  let lane: RecommendedLane = "breathwork";
  let intent = inferIntent(m);
  let bodyState = bodyHeavy || physicalFatigue || postTraining ? "fatigued" : "neutral";
  let mindState = scattered ? "scattered" : anxious || wired ? "activated" : "neutral";
  let emotionalTone = shame ? "shame" : anxious ? "anxious" : energised ? "positive" : flat ? "low" : "neutral";
  const competing: string[] = [];
  let reason = "Default interpretation.";

  if (urge) {
    primaryState = "active_urge"; lane = "urge_interrupt"; intent = "stop_an_urge";
    reason = "Urge / compulsion language detected — highest priority.";
  } else if (anxious || wired || overwhelmed) {
    primaryState = "anxious_wired"; lane = "breathwork"; intent = "calm_down";
    reason = "Activated nervous system language.";
  } else if (missed || shame) {
    primaryState = "missed_day_reentry"; lane = "re_entry"; intent = "get_back_on_track";
    reason = "Missed day / shame / falling-off language.";
  } else if (postTraining || physicalFatigue || bodyHeavy || /\b(sauna|cold (plunge|shower|exposure)|ice bath|need to recover|body (needs to )?come down)\b/i.test(m)) {
    primaryState = "physical_recovery"; lane = "recovery"; intent = "recover";
    reason = "Physical fatigue / post-training / recovery language.";
  } else if (energised && !/\b(late|tonight|bedtime|sleep)\b/i.test(m)) {
    primaryState = "energised_ready"; lane = "breathwork"; intent = "switch_on";
    reason = "Positive energy / attack-the-day language.";
  } else if (scattered) {
    primaryState = "scattered_focus"; lane = "focus_lock_in"; intent = "focus";
    reason = "Scattered / focus / lock-in language.";
  } else if (positiveAfterWalk) {
    primaryState = "positive_momentum"; lane = "focus_lock_in"; intent = "focus";
    reason = "Post-walk positive momentum — lock in the state.";
  } else if (VAGUE_LOW_STATE.test(m) && !hasAnyQualifier(m)) {
    primaryState = "low_state_unclear"; lane = "daily_minimum_checkin"; intent = "reset";
    reason = "Vague low-state language with no qualifier — ask a clarifying question.";
  } else if (flat) {
    primaryState = "low_drive"; lane = "breathwork"; intent = "switch_on";
    reason = "Low-drive language.";
  } else {
    primaryState = "neutral"; lane = "breathwork"; intent = intent || "unspecified";
    reason = "No strong natural-language signal.";
  }

  // Secondary states (anything additionally observed)
  const secondary: string[] = [];
  if (primaryState !== "active_urge" && urge) secondary.push("active_urge");
  if (primaryState !== "anxious_wired" && (anxious || wired || overwhelmed)) secondary.push("anxious_wired");
  if (primaryState !== "missed_day_reentry" && (missed || shame)) secondary.push("missed_day_reentry");
  if (primaryState !== "physical_recovery" && (physicalFatigue || bodyHeavy || postTraining)) secondary.push("physical_recovery");
  if (primaryState !== "scattered_focus" && scattered) secondary.push("scattered_focus");
  if (primaryState !== "positive_momentum" && positiveAfterWalk) secondary.push("positive_momentum");
  if (primaryState !== "low_drive" && flat) secondary.push("low_drive");

  // Competing signals — when high-risk + recovery signals coexist, surface it.
  if (urge && (missed || shame)) competing.push("urge_vs_shame");
  if ((anxious || wired) && (physicalFatigue || bodyHeavy)) competing.push("anxious_vs_fatigue");
  if (postWalk && (anxious || wired)) competing.push("walk_vs_activated");
  if (postWalk && urge) competing.push("walk_vs_urge");

  const clarificationNeeded = primaryState === "low_state_unclear";
  const confidence: InterpreterConfidence =
    primaryState === "low_state_unclear" ? "low"
      : secondary.length >= 2 ? "medium"
      : "high";
  const riskLevel = inferRisk(m, denied);

  return {
    primaryState,
    secondaryStates: secondary,
    intent,
    bodyState,
    mindState,
    emotionalTone,
    riskLevel,
    recommendedLane: lane,
    recommendedBreathworkId: clarificationNeeded
      ? undefined
      : (context.prescription?.selectedBreathworkProtocol ?? undefined),
    confidence,
    reason,
    competingSignals: competing,
    clarificationNeeded,
  };

}
