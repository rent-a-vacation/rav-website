// ============================================================================
// Rent-A-Vacation — Reusable Typst Brand Template
// Usage: #import "rav-brand-template.typ": *
// ============================================================================

// --- Brand Colors -----------------------------------------------------------
#let rav-teal    = rgb("#1C7268")
#let rav-coral   = rgb("#E8703A")
#let rav-navy    = rgb("#1D2E38")
#let rav-cream   = rgb("#F8F6F3")
#let rav-white   = rgb("#FFFFFF")
#let rav-gray    = rgb("#6B7280")
#let rav-light   = rgb("#E5E7EB")

// --- Cover Page Function ----------------------------------------------------
// Call this once at the top of your document.
// logo-path: path to rav-logo.png (relative to the .typ file)
// mascot-path: optional mascot image
// title, subtitle, date, tagline: cover text
#let rav-cover(
  logo-path: none,
  mascot-path: none,
  title: "Document Title",
  subtitle: "",
  date: "",
  tagline: "Your Timeshare. Their Dream Vacation.",
  about: "",
) = {
  set page(
    margin: (top: 0cm, bottom: 0cm, left: 0cm, right: 0cm),
    header: none,
    footer: none,
    numbering: none,
  )

  // Teal top bar
  place(top + left, rect(width: 100%, height: 1.2cm, fill: rav-teal))

  // Coral accent strip
  place(top + left, dy: 1.2cm, rect(width: 100%, height: 0.3cm, fill: rav-coral))

  v(3.5cm)

  // Logo
  if logo-path != none {
    align(center, image(logo-path, width: 6cm))
    v(1cm)
  }

  // Title block
  align(center)[
    #text(size: 28pt, weight: "bold", fill: rav-navy)[#title]
    #v(0.4cm)
    #if subtitle != "" {
      text(size: 14pt, fill: rav-gray)[#subtitle]
      v(0.3cm)
    }
    #if date != "" {
      text(size: 12pt, fill: rav-gray)[#date]
      v(0.8cm)
    }
  ]

  // Mascot
  if mascot-path != none {
    align(center, image(mascot-path, width: 3cm))
    v(0.5cm)
  }

  // Tagline
  align(center)[
    #text(size: 11pt, style: "italic", fill: rav-teal)[#tagline]
  ]

  // About blurb
  if about != "" {
    v(0.8cm)
    align(center, block(width: 70%)[
      #text(size: 10pt, fill: rav-gray)[#about]
    ])
  }

  // Bottom bar
  place(bottom + left, rect(width: 100%, height: 0.8cm, fill: rav-navy))
  place(bottom + left, dy: -0.1cm, dx: 0cm,
    block(width: 100%, height: 0.8cm,
      align(center + horizon,
        text(size: 8pt, fill: rav-white)[For Authorized Team Members]
      )
    )
  )

  pagebreak()
}

// --- Document Setup Function ------------------------------------------------
// Call after the cover page to configure running headers/footers and page style.
// section-title: displayed in the header bar
#let rav-setup(
  logo-path: none,
  classification: "For Authorized Team Members",
  body,
) = {
  set page(
    margin: (top: 2.8cm, bottom: 2.2cm, left: 2.5cm, right: 2.5cm),
    header: {
      // Teal header bar
      place(top + left, dy: -1cm,
        rect(width: 100% + 5cm, height: 0.6cm, fill: rav-teal,
          align(center + horizon,
            text(size: 9pt, fill: rav-white, weight: "bold")[
              Rent-A-Vacation QA Testing Playbook
            ]
          )
        )
      )
    },
    footer: {
      line(length: 100%, stroke: 0.5pt + rav-light)
      v(0.3cm)
      grid(
        columns: (1fr, 1fr, 1fr),
        align(left, text(size: 8pt, fill: rav-gray)[© 2026 Rent-A-Vacation]),
        align(center, text(size: 8pt, fill: rav-gray)[#classification]),
        align(right, text(size: 8pt, fill: rav-gray)[
          Page #context counter(page).display("1")
        ]),
      )
    },
    numbering: "1",
  )

  // Typography
  set text(
    font: ("Roboto", "Segoe UI", "Helvetica Neue", "Arial"),
    size: 10pt,
    fill: rav-navy,
  )

  set par(
    leading: 0.7em,
    justify: true,
  )

  // Heading styles
  set heading(numbering: none)

  show heading.where(level: 1): it => {
    v(0.5cm)
    block(width: 100%, below: 0.5cm)[
      #rect(width: 100%, fill: rav-teal, inset: (x: 0.6cm, y: 0.35cm), radius: 2pt)[
        #text(size: 16pt, weight: "bold", fill: rav-white)[#it.body]
      ]
    ]
  }

  show heading.where(level: 2): it => {
    v(0.3cm)
    block(below: 0.3cm)[
      #text(size: 13pt, weight: "bold", fill: rav-teal)[#it.body]
      #v(-0.1cm)
      #line(length: 100%, stroke: 1pt + rav-coral)
    ]
  }

  show heading.where(level: 3): it => {
    v(0.2cm)
    block(below: 0.2cm)[
      #text(size: 11pt, weight: "bold", fill: rav-navy)[#it.body]
    ]
  }

  // Table styling
  show table: set table(
    stroke: 0.5pt + rav-light,
    inset: (x: 0.5em, y: 0.5em),
    align: (x, y) => {
      if y == 0 { center } else { left }
    },
  )

  // Code/raw blocks
  show raw.where(block: true): it => {
    block(
      width: 100%,
      fill: rgb("#F3F4F6"),
      inset: 0.6em,
      radius: 3pt,
      it,
    )
  }

  show raw.where(block: false): it => {
    box(fill: rgb("#F3F4F6"), inset: (x: 0.3em, y: 0.15em), radius: 2pt, it)
  }

  body
}

// --- Branded Table Helper ---------------------------------------------------
// header-cells: array of header strings
// rows: array of arrays of cell content
// widths: optional column width proportions
#let rav-table(header-cells, ..rows, widths: none) = {
  let cols = if widths != none { widths } else { (1fr,) * header-cells.len() }
  let header-row = header-cells.map(h =>
    table.cell(fill: rav-teal)[
      #text(fill: rav-white, weight: "bold", size: 9pt)[#h]
    ]
  )
  table(
    columns: cols,
    align: (x, y) => {
      if y == 0 { center + horizon } else { left + horizon }
    },
    ..header-row,
    ..rows.pos().flatten(),
  )
}

// --- Info Box ---------------------------------------------------------------
#let rav-info(content, title: "Note") = {
  block(
    width: 100%,
    fill: rgb("#F0FDFA"),
    stroke: 1pt + rav-teal,
    radius: 4pt,
    inset: 0.8em,
  )[
    #text(weight: "bold", fill: rav-teal)[#title] \
    #content
  ]
}

// --- Test Case Block --------------------------------------------------------
#let test-case(id, title, page: "", steps: (), expected: "", note: "") = {
  block(width: 100%, below: 0.6cm)[
    #text(weight: "bold", size: 10.5pt, fill: rav-navy)[#id: #title]
    #v(0.15cm)
    #if page != "" {
      text(size: 9pt, fill: rav-gray)[*Page:* #raw(page)]
      v(0.1cm)
    }
    *Steps:*
    #for (i, step) in steps.enumerate() {
      [#{i + 1}. #step \ ]
    }
    #v(0.1cm)
    *Expected:* #expected
    #v(0.1cm)
    #grid(
      columns: (auto, auto, 1fr),
      gutter: 1em,
      [▢ Pass],
      [▢ Fail],
      [Notes: #box(width: 100%, stroke: (bottom: 0.5pt + rav-gray), inset: (bottom: 0.3em))[]],
    )
  ]
}
