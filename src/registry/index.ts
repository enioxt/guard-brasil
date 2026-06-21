/**
 * Institution Profile Registry — Guard Brasil extensibility layer
 *
 * Every state, court, health system or public entity has identifiers
 * in formats that generic scanners don't know. This registry lets each
 * institution define its own PII patterns without touching Guard Brasil core.
 *
 * Usage:
 *   import { computeConfidenceFromHITL } from 'guard-brasil/registry';
 *
 * Contributing a profile:
 *   1. Create `<institution>.ts` in your own package
 *   2. Export an `InstitutionProfile` following the type contract
 *   3. Add patterns with `confidence: 'low'`
 *   4. Run HITL validation on a synthetic corpus
 *   5. Pass patterns via: `GuardBrasil.create({ customPatterns: myProfile.patterns })`
 */

export { computeConfidenceFromHITL, HITL_CONFIDENCE_THRESHOLDS } from './types.js';
export type { InstitutionProfile, HITLReviewResult } from './types.js';
