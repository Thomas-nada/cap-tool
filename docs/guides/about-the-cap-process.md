# How the CAP Process Was Built

The Cardano Constitution can be changed. But for that right to mean something in practice, there needed to be a clear, fair, and community-driven way to exercise it. This is the story of how that process was designed, and where it is headed.

---

## The Question Nobody Had Answered

When the Cardano Constitution was ratified in late 2024, it was a landmark moment. For the first time, the Cardano blockchain had a foundational governance document: a set of rules and values that the community had agreed to live by.

But almost immediately, a practical question surfaced: *what happens when we need to change it?*

The Constitution itself says that changes can be proposed and voted on. That right exists. But a right without a process is just a theory. Without an agreed-upon method for proposing, debating, and refining constitutional changes, the door was open to problems: rushed amendments with no real debate, changes that only technically literate people could participate in, or well-funded groups pushing through changes that the broader community never had a real chance to scrutinize.

Something needed to be built. And in October 2025, a working group was formed to build it.

---

## Who Got in the Room

The Constitutional Amendment Process (CAP) Working Group was set up under the Cardano Civics Committee, bringing together people from across the Cardano ecosystem. Members came from the Cardano Foundation, Intersect, IOG, and, crucially, the community itself, including independent DReps and governance participants from around the world.

The founding voting members were Nicolas Cerny, Megan Dyamond, Larisa Mcfarlane, Thomas Lindseth, Bosko Majdanac, Ken-Erik Ølmheim, Tevo Saks, Gintama, Jo Allum, and Boaz Balume, with Thomas Upfield and Ryan Williams as advisors.

They committed to meeting every Thursday at 9am UTC and working through the problem together. All meetings were recorded and made available publicly.

The [working group charter](https://docs.google.com/document/d/1yiU8E6x2svg5ZjsBtt39DN-j8e7eI-K1_VeMUG10Uzc/edit?usp=sharing) set out three things to deliver:

1. A document defining *what* the process must achieve
2. A document defining *how* the process would work
3. The actual tool people would use to participate

---

## The First Question: Who Is This Actually For?

From the very first meeting, a key question emerged that would shape the entire project.

The early instinct was to model the amendment process on the existing system Cardano uses for technical protocol improvements, a well-established process that lives on GitHub. GitHub is a platform widely used by software developers to collaborate on code.

The idea was sound, but the group was quick to raise an important concern. Most people in the Cardano community are not software developers. DReps, SPOs, regular ADA holders, governance participants from countries with limited internet infrastructure: if you require someone to use GitHub to propose or comment on a constitutional amendment, you've already excluded a huge portion of the people this process is supposed to serve.

Another perspective encouraged the group to take a step back. Before deciding on any tool or platform, agree first on the *tests* the process must pass. Three stood out in particular: a legitimacy test (will people accept it as fair?), an accessibility test (can anyone participate?), and a traceability test (can every decision be followed back to its source?).

There were also calls for defined minimum consultation periods, because without floors there would be no protection against rushed amendments. And there were calls for quantified feedback mechanisms that tracked community input systematically rather than just collecting unstructured comments.

These conversations about technical rigour vs. openness and GitHub vs. accessibility continued throughout the entire first phase of the project. The resolution that eventually emerged was elegant: **GitHub as the backbone that stores everything permanently and transparently, but a clean, simple website as the front door that anyone can walk through.**

---

## Phase 1: Writing Down What the Process Must Do

Before designing anything, the group spent six weeks writing down exactly what the amendment process *must* achieve.

This wasn't a wish list. It was a proper requirements document, approved by the Civics Committee on 4 December 2025.

The requirements broke down into three levels.

### The Core Principles

Nine foundational principles that any acceptable amendment process must uphold:

- **Resilience:** The process can't break down in a crisis or allow people to rush through changes under pressure
- **Inclusivity:** Anyone, regardless of technical skill, language, or location, must be able to participate
- **Deliberative Quality:** Changes must be evidence-based and properly debated, not just rubber-stamped
- **Transparency:** Every step, every revision, every decision must be publicly visible
- **Accountability:** Anyone with power in the process must have clear limits and oversight
- **Iterative Learning:** The process itself must be able to improve over time
- **Proportionality:** A small grammar fix shouldn't require the same effort as rewriting a core principle
- **Sustainability:** The process must be something people can keep running for years, not just a one-off event
- **Legitimacy:** People must be able to trust it as fair, even when they disagree with a specific outcome

### What the Process Must Actually Do

Three operational requirements defined the basic shape of any acceptable process:

1. Every amendment must clearly state *why* a change is needed, *what* text is being changed, and *what effect* the change is expected to have
2. Every amendment must go through a public consultation period with an editorial review
3. Every amendment must end with a final version ready for an on-chain vote, with a complete public record of how it got there

### The Technical Rules

The technology supporting the process must be open-source (anyone can inspect it), verifiable (anyone can check it independently), and built to last, not locked into any one company or platform.

The full [Phase 1 Requirements Document](https://docs.google.com/document/d/1BvTW5LlFezNXG5agxZ6Gi35f-3Ma_mzlVEk8aGmu0wE/edit?usp=sharing) is publicly available.

---

## A Pivot: Scrapping the Rigid Timeline

The original plan had three separate phases with four-week windows each. By January 2026, the group had realized this structure was getting in the way.

The problem: designing the process and building the tool are not two separate activities you can do one after the other. Every time you try to build something, you discover design questions you hadn't thought of. And every design decision changes what you need to build.

So the group updated its [charter](https://docs.google.com/document/d/1iSrvuWTQGOlQYIq536huYDwM67GuFTrqQEilIi2pE70/edit?usp=sharing). Phases 2 and 3 were merged into a single eight-week period of building, testing, and refining simultaneously. This was the right call, and the speed of progress accelerated immediately afterwards.

---

## Phase 2: Designing and Building the Actual Thing

### Two Ways to Participate

One of the most thoughtful design decisions of the whole project was the creation of two separate pathways into the amendment process:

**Constitutional Amendment Proposals (CAPs):** for when you have a specific change you want to make to the Constitution. This is the main pathway, with full editorial review and consultation requirements.

**Constitution Issue Statements (CISs):** for when you've spotted a problem but aren't ready to propose a solution yet. CISs create a public record of known issues in the Constitution, which others can later pick up and turn into formal proposals.

This matters because it removes a barrier. Under a CAP-only system, someone who sees a problem but doesn't know how to fix it has nowhere to go. The CIS pathway gives them a voice without requiring them to have all the answers.

### Not All Changes Are Equal

One of the clearest improvements over a one-size-fits-all approach is the **category system**. Different types of amendments get different recommended consultation periods, reflecting how significant the change actually is:

| Type of Change | Example | Minimum Discussion Period |
| :--- | :--- | :---: |
| **Editorial** | Fixing a typo or broken link | 14 days |
| **Interpretive** | Clarifying wording without changing meaning | 30 days |
| **Procedural** | Changing how a governance process works | 60 days |
| **Substantive** | Changing a core principle or value | 60 days |
| **Technical** | Changing on-chain economic rules | Varies |
| **Other** | Anything that doesn't fit the above | 30 days |

It's worth being clear about what these periods are: **recommended minimums, not hard rules**. Because Cardano is a decentralized system, nobody can actually stop someone from submitting an amendment directly on-chain without going through this process at all. What this process provides is legitimacy. It shows that a proposal has been properly debated and refined before the community votes on it.

### The Editors: Guardians of Process, Not Content

Every proposal that enters the CAP process gets reviewed by a **CAP Editor**. But what an editor can and cannot do was one of the most carefully debated questions of the entire project.

The answer the group landed on: editors are **process guardians, not content gatekeepers**.

What they *can* do: check whether a proposal is internally consistent, whether it conflicts with other parts of the Constitution, whether the grammar is clear, and whether the change might have unintended knock-on effects. They can suggest improvements, flag concerns, and organize public discussions about proposals.

What they *cannot* do: block a proposal, rewrite its meaning, or use their position to favour some proposals over others.

The author always retains ownership of their proposal. If an editor suggests a change, the author can accept it, reject it, or ignore it. The community can see the full history of what was suggested and what was accepted at every step. As the [Editor Role document](https://docs.google.com/document/d/1nVbi7NHeEeUxE_dyzIZVa1Xo5vMSk6D-iE3vCT_Gtp4/edit?usp=sharing) puts it: *"The Editor protects the quality of the process; the Author defines the power of the proposal."*

The first three editors, known as the **Bootstrap Cohort**, will be selected from the working group by the Civics Committee and will serve a one-year term. After that, the community will have a say in how future editors are chosen.

### Knowing Where Every Proposal Stands

One practical challenge with any multi-step process is that it becomes hard to track where things are. To solve this, the group designed a **tagging system**: a set of labels that get applied to every proposal to show exactly what stage it's at.

A proposal moves through clear stages: `draft → submitted → review → consultation → revision → finalizing → ready → onchain → done`. At any point, anyone can look at a proposal and see exactly where it is and what needs to happen next.

There are also tags for special situations: grouping small changes together, putting something on hold, fast-tracking urgent changes, and editor signal tags that only editors can apply. This keeps things transparent without creating noise.

---

## Listening to the Community Along the Way

The working group didn't design in isolation. Two major workshops brought in voices from beyond the core group:

The **Day Zero Workshop** at the Cardano Summit was the first public test of the concepts, held before the design was even finished. It was about socializing the idea and hearing reactions from people who hadn't been part of the internal debates.

The **Berlin Workshop** was more structured, gathering detailed feedback from community members who were entirely new to the process. Their reactions directly shaped decisions about the tool. If people who hadn't lived the design process couldn't figure something out, that was a signal something needed to change.

Both workshops and all meeting transcripts are available publicly, in the [workshops folder](https://drive.google.com/drive/folders/1j_fmp8fShyeL10LnPh0L8rkjYgk6q4Sh?usp=sharing) and the [meeting transcripts folder](https://drive.google.com/drive/folders/1oILReUq36yM3J-eYABr_9dY9R3l3heOJ?usp=sharing).

---

## Where Things Stand Today

As of late April 2026, the CAP process is ready for public testing. The tool is live, the process is documented, and the working group has completed a final round of internal testing and refinement.

A few things are still genuinely open, and the working group has been honest about that. The question of exactly *who* submits the final on-chain governance action at the end of the process hasn't been fully resolved. Multilingual support is on the roadmap but not yet built. And some of the longer-term governance mechanics, like exactly how the process will be formally reviewed and updated over time, are intentionally left to be defined once there's real-world experience to draw on.

These aren't failures. They're honest acknowledgements that some things can only be designed well once you've seen the process in action.

---

## What Comes Next

The pre-release isn't the end of the story. It's the beginning of a new chapter, and there's a clear path ahead.

**Finalizing the tool and the process document.** The CAP Portal is live and the Phase 2 Deliverables document, which sets out the full process design, is in its final stages. Both will be completed in parallel, with each informing the other. Any refinements that come out of testing feed back into the documentation, and any gaps in the documentation get addressed in the tool.

**Public testing and feedback.** Once the pre-release opens, real community members outside the working group will use the tool to draft, submit, and track constitutional amendment proposals for the first time. That feedback is essential. Six months of internal work can only surface so much. Real users will find things that the group didn't anticipate, and those findings will drive another round of improvements before the process is fully launched.

**Editor selection.** Alongside testing, the first three editors will be formally selected from the working group and ratified by the Civics Committee. These editors will make up the Bootstrap Cohort, running the process for its first year and developing the longer-term governance model for how future editors are chosen.

**Moving from testing to launch.** Once the tool is stable, the feedback from public testing has been addressed, and the editors are in place, the CAP process will move from pre-release into full public availability. At that point, any community member will be able to submit a constitutional amendment proposal through a transparent, structured, and community-endorsed process, and the Cardano Constitution will have a clear and principled path for how it evolves over time.

---

## Source Documents

| Document | Link |
| :--- | :--- |
| CAP WG Charter v1.0 | [View](https://docs.google.com/document/d/1yiU8E6x2svg5ZjsBtt39DN-j8e7eI-K1_VeMUG10Uzc/edit?usp=sharing) |
| CAP WG Charter v2.0 | [View](https://docs.google.com/document/d/1iSrvuWTQGOlQYIq536huYDwM67GuFTrqQEilIi2pE70/edit?usp=sharing) |
| Phase 1 Requirements Document | [View](https://docs.google.com/document/d/1BvTW5LlFezNXG5agxZ6Gi35f-3Ma_mzlVEk8aGmu0wE/edit?usp=sharing) |
| Phase 2 Deliverables Document | [View](https://docs.google.com/document/d/10F2CDclL3BkD0mmVDbJL6M-BolFngwyoh498MBG6krs/edit?usp=sharing) |
| CAP Editor Role Document | [View](https://docs.google.com/document/d/1nVbi7NHeEeUxE_dyzIZVa1Xo5vMSk6D-iE3vCT_Gtp4/edit?usp=sharing) |
| CAP Tagging System Document | [View](https://docs.google.com/document/d/1-_zCl-9dM6oFIyLnTCjYVZCdphyQiunvIOgkWQCFMF0/edit?usp=sharing) |
| WG Meeting Transcripts | [View folder](https://drive.google.com/drive/folders/1oILReUq36yM3J-eYABr_9dY9R3l3heOJ?usp=sharing) |
| Workshop Materials | [View folder](https://drive.google.com/drive/folders/1j_fmp8fShyeL10LnPh0L8rkjYgk6q4Sh?usp=sharing) |
