/**
 * @fileoverview Disallow hardcoded Tailwind palette classes. Enforce semantic tokens (e.g., bg-semantic-primary).
 * Reports when classes like bg-blue-600, text-red-500, border-gray-200, ring-emerald-300 appear.
 *
 * Options:
 * - allow: string[] of regex patterns to allow (e.g., ["bg-transparent", "^ring-offset-"])
 */
"use strict";

const COLOR_GROUPS = [
  "slate","gray","zinc","neutral","stone",
  "red","orange","amber","yellow","lime","green","emerald","teal","cyan",
  "sky","blue","indigo","violet","purple","fuchsia","pink","rose"
];

const ATTRIBUTES = ["bg","text","border","ring","fill","stroke","from","via","to","outline"];

/** Build a regex that matches tailwind color utilities with numeric shade: bg-blue-600, text-gray-200 */
const shade = "(?:[1-9]00)";
const colorAlternation = COLOR_GROUPS.join("|");
const attrAlternation = ATTRIBUTES.join("|");
const PALETTE_RE = new RegExp(`\\b(?:${attrAlternation})-(?:${colorAlternation})-${shade}\\b`, "g");

/** Also catch ring-offset and other variants with color */
const RING_OFFSET_RE = new RegExp(`\\bring-offset-(?:${colorAlternation})-${shade}\\b`, "g");

function classNameStringLiterals(context, node, raw) {
  const allow = (context.options && context.options[0] && context.options[0].allow) || [];
  const allowRes = allow.map((p) => new RegExp(p));
  function isAllowed(token) {
    return allowRes.some((re) => re.test(token));
  }

  const reportToken = (token, idx) => {
    if (isAllowed(token)) return;
    context.report({
      node,
      message: "Hardcoded palette class '{{token}}' is disallowed. Use semantic tokens (e.g., bg-semantic-primary) or theme CSS variables.",
      data: { token },
      loc: node.loc
    });
  };

  const tokens = raw.split(/\s+/);
  tokens.forEach((t) => {
    if (PALETTE_RE.test(t) || RING_OFFSET_RE.test(t)) {
      reportToken(t);
    }
  });
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow hardcoded Tailwind palette classes to prevent design drift.",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          allow: { type: "array", items: { type: "string" } }
        },
        additionalProperties: false
      }
    ],
    messages: {}
  },
  create(context) {
    return {
      JSXAttribute(node) {
        try {
          if (!node.name || node.name.name !== "className") return;
          const val = node.value;
          if (!val) return;
          if (val.type === "Literal" && typeof val.value === "string") {
            classNameStringLiterals(context, node, val.value);
          } else if (val.type === "JSXExpressionContainer") {
            const expr = val.expression;
            if (expr && expr.type === "Literal" && typeof expr.value === "string") {
              classNameStringLiterals(context, node, expr.value);
            } else if (expr && expr.type === "TemplateLiteral") {
              const raw = expr.quasis.map((q) => q.value.cooked).join(" ");
              classNameStringLiterals(context, node, raw);
            }
          }
        } catch (e) {
          // be resilient; do not crash linting
        }
      },
      Literal(node) {
        try {
          // Generic catch for className-like props in Headless UI etc.
          if (typeof node.value !== "string") return;
          if (!/class(Name)?=/.test(context.getSourceCode().getText(node.parent || node))) return;
          classNameStringLiterals(context, node, node.value);
        } catch {}
      }
    };
  }
};
