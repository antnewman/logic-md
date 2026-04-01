import { describe, expect, it } from "vitest";
import {
	ExpressionError,
	TokenType,
	type Token,
	type ASTNode,
	tokenize,
	parse,
} from "./expression.js";

// =============================================================================
// Lexer Tests
// =============================================================================

describe("tokenize", () => {
	it("tokenizes integer literal", () => {
		const tokens = tokenize("42");
		expect(tokens).toEqual([
			{ type: TokenType.Number, value: "42", position: 0 },
			{ type: TokenType.EOF, value: "", position: 2 },
		]);
	});

	it("tokenizes decimal literal", () => {
		const tokens = tokenize("3.14");
		expect(tokens).toEqual([
			{ type: TokenType.Number, value: "3.14", position: 0 },
			{ type: TokenType.EOF, value: "", position: 4 },
		]);
	});

	it("tokenizes double-quoted string literal", () => {
		const tokens = tokenize('"hello"');
		expect(tokens).toEqual([
			{ type: TokenType.String, value: "hello", position: 0 },
			{ type: TokenType.EOF, value: "", position: 7 },
		]);
	});

	it("tokenizes single-quoted string literal", () => {
		const tokens = tokenize("'world'");
		expect(tokens).toEqual([
			{ type: TokenType.String, value: "world", position: 0 },
			{ type: TokenType.EOF, value: "", position: 7 },
		]);
	});

	it("tokenizes boolean true", () => {
		const tokens = tokenize("true");
		expect(tokens).toEqual([
			{ type: TokenType.Boolean, value: "true", position: 0 },
			{ type: TokenType.EOF, value: "", position: 4 },
		]);
	});

	it("tokenizes boolean false", () => {
		const tokens = tokenize("false");
		expect(tokens).toEqual([
			{ type: TokenType.Boolean, value: "false", position: 0 },
			{ type: TokenType.EOF, value: "", position: 5 },
		]);
	});

	it("tokenizes null", () => {
		const tokens = tokenize("null");
		expect(tokens).toEqual([
			{ type: TokenType.Null, value: "null", position: 0 },
			{ type: TokenType.EOF, value: "", position: 4 },
		]);
	});

	it("tokenizes identifier", () => {
		const tokens = tokenize("output");
		expect(tokens).toEqual([
			{ type: TokenType.Identifier, value: "output", position: 0 },
			{ type: TokenType.EOF, value: "", position: 6 },
		]);
	});

	it("tokenizes two-char operators", () => {
		const ops: Array<[string, TokenType]> = [
			["==", TokenType.EqualEqual],
			["!=", TokenType.BangEqual],
			["<=", TokenType.LessEqual],
			[">=", TokenType.GreaterEqual],
			["&&", TokenType.AmpAmp],
			["||", TokenType.PipePipe],
		];
		for (const [op, type] of ops) {
			const tokens = tokenize(op);
			expect(tokens[0]).toEqual({ type, value: op, position: 0 });
		}
	});

	it("tokenizes single-char operators and delimiters", () => {
		const ops: Array<[string, TokenType]> = [
			[".", TokenType.Dot],
			["<", TokenType.Less],
			[">", TokenType.Greater],
			["!", TokenType.Bang],
			["?", TokenType.Question],
			[":", TokenType.Colon],
			["(", TokenType.LeftParen],
			[")", TokenType.RightParen],
			[",", TokenType.Comma],
		];
		for (const [op, type] of ops) {
			const tokens = tokenize(op);
			expect(tokens[0]).toEqual({ type, value: op, position: 0 });
		}
	});

	it("tokenizes compound expression", () => {
		const tokens = tokenize("output.findings.length > 0");
		const types = tokens.map((t) => t.type);
		expect(types).toEqual([
			TokenType.Identifier,
			TokenType.Dot,
			TokenType.Identifier,
			TokenType.Dot,
			TokenType.Identifier,
			TokenType.Greater,
			TokenType.Number,
			TokenType.EOF,
		]);
	});

	it("throws ExpressionError on unexpected character", () => {
		expect(() => tokenize("@")).toThrow(ExpressionError);
	});

	it("skips whitespace correctly", () => {
		const tokens = tokenize("  a  ");
		expect(tokens).toEqual([
			{ type: TokenType.Identifier, value: "a", position: 2 },
			{ type: TokenType.EOF, value: "", position: 5 },
		]);
	});
});

// =============================================================================
// Parser Tests
// =============================================================================

describe("parse", () => {
	/** Helper: tokenize then parse */
	function p(input: string): ASTNode {
		return parse(tokenize(input));
	}

	it("parses number literal", () => {
		expect(p("42")).toEqual({ type: "Literal", value: 42 });
	});

	it("parses decimal number literal", () => {
		expect(p("3.14")).toEqual({ type: "Literal", value: 3.14 });
	});

	it("parses string literal", () => {
		expect(p('"hello"')).toEqual({ type: "Literal", value: "hello" });
	});

	it("parses boolean literal true", () => {
		expect(p("true")).toEqual({ type: "Literal", value: true });
	});

	it("parses boolean literal false", () => {
		expect(p("false")).toEqual({ type: "Literal", value: false });
	});

	it("parses null literal", () => {
		expect(p("null")).toEqual({ type: "Literal", value: null });
	});

	it("parses identifier", () => {
		expect(p("output")).toEqual({ type: "Identifier", name: "output" });
	});

	it("parses dot access", () => {
		expect(p("output.findings")).toEqual({
			type: "MemberExpression",
			object: { type: "Identifier", name: "output" },
			property: "findings",
		});
	});

	it("parses chained dot access", () => {
		expect(p("output.findings.length")).toEqual({
			type: "MemberExpression",
			object: {
				type: "MemberExpression",
				object: { type: "Identifier", name: "output" },
				property: "findings",
			},
			property: "length",
		});
	});

	it("parses binary expression", () => {
		expect(p("a > 0")).toEqual({
			type: "BinaryExpression",
			operator: ">",
			left: { type: "Identifier", name: "a" },
			right: { type: "Literal", value: 0 },
		});
	});

	it("parses unary expression", () => {
		expect(p("!done")).toEqual({
			type: "UnaryExpression",
			operator: "!",
			operand: { type: "Identifier", name: "done" },
		});
	});

	it("parses ternary / conditional expression", () => {
		expect(p("a ? b : c")).toEqual({
			type: "ConditionalExpression",
			test: { type: "Identifier", name: "a" },
			consequent: { type: "Identifier", name: "b" },
			alternate: { type: "Identifier", name: "c" },
		});
	});

	it("parses method call with args", () => {
		expect(p("items.contains(x)")).toEqual({
			type: "CallExpression",
			callee: { type: "Identifier", name: "items" },
			property: "contains",
			args: [{ type: "Identifier", name: "x" }],
		});
	});

	it("parses method call no args", () => {
		expect(p("items.every()")).toEqual({
			type: "CallExpression",
			callee: { type: "Identifier", name: "items" },
			property: "every",
			args: [],
		});
	});

	it("parses grouped expression for precedence override", () => {
		const ast = p("(a || b) && c");
		expect(ast).toEqual({
			type: "BinaryExpression",
			operator: "&&",
			left: {
				type: "BinaryExpression",
				operator: "||",
				left: { type: "Identifier", name: "a" },
				right: { type: "Identifier", name: "b" },
			},
			right: { type: "Identifier", name: "c" },
		});
	});

	it("respects AND > OR precedence", () => {
		// a || b && c  should parse as  a || (b && c)
		const ast = p("a || b && c");
		expect(ast).toEqual({
			type: "BinaryExpression",
			operator: "||",
			left: { type: "Identifier", name: "a" },
			right: {
				type: "BinaryExpression",
				operator: "&&",
				left: { type: "Identifier", name: "b" },
				right: { type: "Identifier", name: "c" },
			},
		});
	});

	it("respects equality > AND precedence", () => {
		// a == b && c != d  should parse as  (a == b) && (c != d)
		const ast = p("a == b && c != d");
		expect(ast).toEqual({
			type: "BinaryExpression",
			operator: "&&",
			left: {
				type: "BinaryExpression",
				operator: "==",
				left: { type: "Identifier", name: "a" },
				right: { type: "Identifier", name: "b" },
			},
			right: {
				type: "BinaryExpression",
				operator: "!=",
				left: { type: "Identifier", name: "c" },
				right: { type: "Identifier", name: "d" },
			},
		});
	});

	it("throws ExpressionError on unexpected token", () => {
		expect(() => p(")")).toThrow(ExpressionError);
	});
});
