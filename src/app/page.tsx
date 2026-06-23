const challengeRooms = [
  {
    name: "Explain",
    prompt: "What does the Fiber payment verifier actually trust?",
    status: "Unlocked",
    score: "84%",
  },
  {
    name: "Debug",
    prompt: "A generated route accepts unpaid access. Patch the guard.",
    status: "Live",
    score: "2 bugs",
  },
  {
    name: "Remix",
    prompt: "Add xUDT pricing without asking the AI for the full diff.",
    status: "Locked",
    score: "Lvl 4",
  },
  {
    name: "Attack",
    prompt: "Break your own paywall before the boss fight does.",
    status: "Locked",
    score: "Risk",
  },
];

const quests = [
  {
    title: "Paywall Reactor",
    track: "Fiber Builder",
    reward: "12 XP + 300 testnet shannons",
    progress: "Comprehension gate 2/5",
  },
  {
    title: "Cell Lab Escape",
    track: "CKB Fundamentals",
    reward: "Proof badge",
    progress: "Boss fight ready",
  },
  {
    title: "No-Prompt Checkout",
    track: "AI Discipline",
    reward: "Multiplier x1.4",
    progress: "Locked until 70%",
  },
];

const telemetry = [
  ["Generated code owned", "41%"],
  ["Tests repaired by human", "7"],
  ["Hint debt", "2 CKB"],
  ["Fiber rewards pending", "920"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fffaf0_0,#f3efe7_36%,#e6edf5_100%)] text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-ink text-sm font-black text-panel">
              VQ
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/55">
                VibeQuest
              </p>
              <h1 className="text-xl font-black leading-tight sm:text-2xl">
                Vibecode. Prove it. Ship it.
              </h1>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-sm font-semibold">
            <a className="rounded-md bg-white px-3 py-2 shadow-panel-sm" href="#arena">
              Arena
            </a>
            <a className="rounded-md px-3 py-2 text-ink/70" href="#quests">
              Quests
            </a>
            <a className="rounded-md px-3 py-2 text-ink/70" href="#proof">
              Proof
            </a>
          </nav>
        </header>

        <section className="grid flex-1 gap-4 py-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div id="arena" className="flex min-h-[620px] flex-col gap-4">
            <div className="rounded-lg border border-ink/10 bg-white/88 p-4 shadow-panel-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-ember">
                    Build Prompt
                  </p>
                  <h2 className="text-2xl font-black leading-tight sm:text-4xl">
                    Generate the app. Then escape black box mode.
                  </h2>
                </div>
                <div className="rounded-md bg-signal px-3 py-2 text-sm font-black text-white">
                  68% owned
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
                <div className="min-h-32 rounded-md border border-ink/15 bg-panel p-4 font-mono text-sm leading-6 text-ink/80">
                  Build a Fiber-powered paid content app with CKB proof receipts,
                  a creator payout split, and a test that blocks unpaid reads.
                </div>
                <div className="grid gap-3">
                  <button className="rounded-md bg-ink px-4 py-3 text-sm font-black text-white transition hover:bg-ember">
                    Start Run
                  </button>
                  <button className="rounded-md border border-ink/15 bg-white px-4 py-3 text-sm font-black text-ink transition hover:border-ink/35">
                    Use Template
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-lg border border-ink/10 bg-ink p-4 text-panel shadow-panel-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-panel/55">
                    Code Arena
                  </p>
                  <span className="rounded bg-ember px-2 py-1 text-xs font-black text-white">
                    AI diff pending
                  </span>
                </div>
                <pre className="overflow-hidden whitespace-pre-wrap rounded-md bg-black/30 p-4 font-mono text-xs leading-5 text-panel/90">
{`if (!payment.receipt || !await verifyFiberReceipt(payment)) {
  return deny("Payment required");
}

// Challenge: explain what prevents replay here,
// then patch the missing session binding.`}
                </pre>
              </div>

              <div className="rounded-lg border border-ink/10 bg-white/88 p-4 shadow-panel-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-wire">
                    Comprehension Meter
                  </p>
                  <span className="text-sm font-black">Gate 3 / 5</span>
                </div>
                <div className="h-4 overflow-hidden rounded bg-ink/10">
                  <div className="h-full w-[68%] bg-gradient-to-r from-signal via-wire to-ember" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {telemetry.map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-md border border-ink/10 bg-panel p-3"
                    >
                      <p className="text-xs font-semibold text-ink/55">
                        {label}
                      </p>
                      <p className="mt-1 text-xl font-black">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {challengeRooms.map((room) => (
                <article
                  key={room.name}
                  className="rounded-lg border border-ink/10 bg-white/88 p-4 shadow-panel-sm"
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h3 className="text-lg font-black">{room.name}</h3>
                    <span className="rounded bg-ink/5 px-2 py-1 text-xs font-bold text-ink/65">
                      {room.status}
                    </span>
                  </div>
                  <p className="min-h-16 text-sm leading-6 text-ink/70">
                    {room.prompt}
                  </p>
                  <p className="mt-4 text-sm font-black text-ember">
                    {room.score}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside className="grid gap-4 lg:grid-rows-[auto_1fr_auto]">
            <section
              id="quests"
              className="rounded-lg border border-ink/10 bg-white/88 p-4 shadow-panel-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-plum">
                    Quest Board
                  </p>
                  <h2 className="text-2xl font-black">Active runs</h2>
                </div>
                <span className="rounded-md bg-panel px-3 py-2 text-xs font-black">
                  Season 0
                </span>
              </div>
              <div className="grid gap-3">
                {quests.map((quest) => (
                  <article
                    key={quest.title}
                    className="rounded-md border border-ink/10 bg-panel p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">{quest.title}</h3>
                        <p className="mt-1 text-sm text-ink/60">
                          {quest.track}
                        </p>
                      </div>
                      <span className="rounded bg-white px-2 py-1 text-xs font-black text-signal">
                        {quest.reward}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-ink/75">
                      {quest.progress}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-ink/10 bg-ink p-4 text-panel shadow-panel-sm">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-panel/55">
                Boss Fight
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight">
                The generated app has one real exploit.
              </h2>
              <p className="mt-3 text-sm leading-6 text-panel/70">
                Clear the final gate by finding it, explaining the failure, and
                shipping a human-authored fix before the timer expires.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-white/10 p-3">
                  <p className="text-2xl font-black">18</p>
                  <p className="text-xs text-panel/55">min</p>
                </div>
                <div className="rounded-md bg-white/10 p-3">
                  <p className="text-2xl font-black">3</p>
                  <p className="text-xs text-panel/55">hints</p>
                </div>
                <div className="rounded-md bg-white/10 p-3">
                  <p className="text-2xl font-black">5x</p>
                  <p className="text-xs text-panel/55">reward</p>
                </div>
              </div>
            </section>

            <section
              id="proof"
              className="rounded-lg border border-ink/10 bg-white/88 p-4 shadow-panel-sm"
            >
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-signal">
                Proof Rail
              </p>
              <h2 className="mt-2 text-2xl font-black">Ship unlocks</h2>
              <div className="mt-4 space-y-3 text-sm font-semibold text-ink/75">
                <p>CKB proof badge after final explanation passes.</p>
                <p>Fiber reward after tests, review, and no-prompt zone clear.</p>
                <p>Recruiter signal grows only from defended code ownership.</p>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
