export const HONEST_LIMITS = {
  estimates: 'Carrier schedule pages (Maersk, Hapag-Lloyd) were blocked or not machine-readable, so base transit days and freight rates are estimates, tagged as such in the data and the UI.',
  cited: 'The only cited number the engine uses is the ~10-day Cape of Good Hope penalty (rs-cape-days). Cape routings are tagged "est. + cited Δ": the base is an estimate, the +10d delta is cited.',
  analogy: 'For Mumbai-Felixstowe and Jebel Ali the 10-day delta is applied by analogy to the Red Sea case and tagged estimate.',
  secondary: 'Cited facts come from Wikipedia plain-text extracts, a secondary source that itself cites Reuters, AP, IMO, DP World and Panama Canal Authority material.',
  primary: 'The Panama Canal Authority link is a primary-source pointer only; its content was not machine-verified.',
  absence: 'The Transpacific lane has no disruption event, so the model demonstrates a "hold" decision. Absence of an entry is not an assurance.',
  statuses: 'Corridor statuses are scenario assumptions (editorial mapping), not a live feed of carrier availability.',
};
