// =============================================================================
// Expression Engine: Lexer + Pratt Parser
// =============================================================================
// Converts expression strings into a typed AST.
// Pipeline: tokenize(input) -> Token[] -> parse(tokens) -> ASTNode
// No eval() or Function constructor -- custom recursive descent Pratt parser.
// =============================================================================

const MAX_AST_DEPTH = 50;

// -----------------------------------------------------------------------------
// ExpressionError
// -----------------------------------------------------------------------------

export class ExpressionError extends Error {
	readonly position?: number;

	constructor(message: string, position?: number) {
		super(message);
		this.name = "ExpressionError";
		this.position = position;
	}
}

// -----------------------------------------------------------------------------
// Token Types & Token
// -----------------------------------------------------------------------------

export enum TokenType {
	Number = "Number",
	String = "String",
	Boolean = "Boolean",
	Null = "Null",
	Identifier = "Identifier",
	Dot = "Dot",
	EqualEqual = "EqualEqual",
	BangEqual = "BangEqual",
	Less = "Less",
	Greater = "Greater",
	LessEqual = "LessEqual",
	GreaterEqual = "GreaterEqual",
	AmpAmp = "AmpAmp",
	PipePipe = "PipePipe",
	Bang = "Bang",
	Question = "Question",
	Colon = "Colon",
	LeftParen = "LeftParen",
	RightParen = "RightParen",
	Comma = "Comma",
	EOF = "EOF",
}

export interface Token {
	type: TokenType;
	value: string;
	position: number;
}

// -----------------------------------------------------------------------------
// AST Node Types (discriminated union)
// -----------------------------------------------------------------------------

export interface LiteralNode {
	type: "Literal";
	value: unknown;
}

export interface IdentifierNode {
	type: "Identifier";
	name: string;
}

export interface MemberExpressionNode {
	type: "MemberExpression";
	object: ASTNode;
	property: string;
}

export interface BinaryExpressionNode {
	type: "BinaryExpression";
	operator: string;
	left: ASTNode;
	right: ASTNode;
}

export interface UnaryExpressionNode {
	type: "UnaryExpression";
	operator: string;
	operand: ASTNode;
}

export interface ConditionalExpressionNode {
	type: "ConditionalExpression";
	test: ASTNode;
	consequent: ASTNode;
	alternate: ASTNode;
}

export interface CallExpressionNode {
	type: "CallExpression";
	callee: ASTNode;
	property: string;
	args: ASTNode[];
}

export type ASTNode =
	| LiteralNode
	| IdentifierNode
	| MemberExpressionNode
	| BinaryExpressionNode
	| UnaryExpressionNode
	| ConditionalExpressionNode
	| CallExpressionNode;

// -----------------------------------------------------------------------------
// Precedence Levels
// -----------------------------------------------------------------------------

enum Precedence {
	None = 0,
	Ternary = 1,
	Or = 2,
	And = 3,
	Equality = 4,
	Comparison = 5,
	Unary = 6,
	Call = 7,
	Member = 8,
}

function getInfixPrecedence(type: TokenType): Precedence {
	switch (type) {
		case TokenType.Question:
			return Precedence.Ternary;
		case TokenType.PipePipe:
			return Precedence.Or;
		case TokenType.AmpAmp:
			return Precedence.And;
		case TokenType.EqualEqual:
		case TokenType.BangEqual:
			return Precedence.Equality;
		case TokenType.Less:
		case TokenType.Greater:
		case TokenType.LessEqual:
		case TokenType.GreaterEqual:
			return Precedence.Comparison;
		case TokenType.Dot:
			return Precedence.Member;
		default:
			return Precedence.None;
	}
}

// -----------------------------------------------------------------------------
// Lexer
// -----------------------------------------------------------------------------

function isDigit(ch: string): boolean {
	return ch >= "0" && ch <= "9";
}

function isAlpha(ch: string): boolean {
	return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
}

function isAlphaNumeric(ch: string): boolean {
	return isAlpha(ch) || isDigit(ch);
}

export function tokenize(input: string): Token[] {
	const tokens: Token[] = [];
	let pos = 0;

	while (pos < input.length) {
		// biome-ignore lint: pos is guaranteed within bounds by while condition
		const ch = input[pos]!;

		// Skip whitespace
		if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
			pos++;
			continue;
		}

		// Two-character operators (check before single-char)
		if (pos + 1 < input.length) {
			const two = `${input[pos]!}${input[pos + 1]!}`;
			let twoCharType: TokenType | undefined;
			switch (two) {
				case "==":
					twoCharType = TokenType.EqualEqual;
					break;
				case "!=":
					twoCharType = TokenType.BangEqual;
					break;
				case "<=":
					twoCharType = TokenType.LessEqual;
					break;
				case ">=":
					twoCharType = TokenType.GreaterEqual;
					break;
				case "&&":
					twoCharType = TokenType.AmpAmp;
					break;
				case "||":
					twoCharType = TokenType.PipePipe;
					break;
			}
			if (twoCharType !== undefined) {
				tokens.push({ type: twoCharType, value: two, position: pos });
				pos += 2;
				continue;
			}
		}

		// Single-character operators and delimiters
		let singleType: TokenType | undefined;
		switch (ch) {
			case ".":
				singleType = TokenType.Dot;
				break;
			case "<":
				singleType = TokenType.Less;
				break;
			case ">":
				singleType = TokenType.Greater;
				break;
			case "!":
				singleType = TokenType.Bang;
				break;
			case "?":
				singleType = TokenType.Question;
				break;
			case ":":
				singleType = TokenType.Colon;
				break;
			case "(":
				singleType = TokenType.LeftParen;
				break;
			case ")":
				singleType = TokenType.RightParen;
				break;
			case ",":
				singleType = TokenType.Comma;
				break;
		}
		if (singleType !== undefined) {
			tokens.push({ type: singleType, value: ch, position: pos });
			pos++;
			continue;
		}

		// Number literals
		if (isDigit(ch)) {
			const start = pos;
			while (pos < input.length && isDigit(input[pos]!)) {
				pos++;
			}
			if (pos < input.length && input[pos]! === ".") {
				pos++;
				while (pos < input.length && isDigit(input[pos]!)) {
					pos++;
				}
			}
			tokens.push({
				type: TokenType.Number,
				value: input.slice(start, pos),
				position: start,
			});
			continue;
		}

		// String literals
		if (ch === '"' || ch === "'") {
			const quote = ch;
			const start = pos;
			pos++; // skip opening quote
			const strStart = pos;
			while (pos < input.length && input[pos]! !== quote) {
				pos++;
			}
			if (pos >= input.length) {
				throw new ExpressionError(`Unterminated string literal`, start);
			}
			const value = input.slice(strStart, pos);
			pos++; // skip closing quote
			tokens.push({ type: TokenType.String, value, position: start });
			continue;
		}

		// Identifiers and keywords
		if (isAlpha(ch)) {
			const start = pos;
			while (pos < input.length && isAlphaNumeric(input[pos]!)) {
				pos++;
			}
			const word = input.slice(start, pos);
			if (word === "true" || word === "false") {
				tokens.push({ type: TokenType.Boolean, value: word, position: start });
			} else if (word === "null") {
				tokens.push({ type: TokenType.Null, value: word, position: start });
			} else {
				tokens.push({
					type: TokenType.Identifier,
					value: word,
					position: start,
				});
			}
			continue;
		}

		throw new ExpressionError(`Unexpected character: ${ch}`, pos);
	}

	tokens.push({ type: TokenType.EOF, value: "", position: pos });
	return tokens;
}

// -----------------------------------------------------------------------------
// Pratt Parser
// -----------------------------------------------------------------------------

export function parse(tokens: Token[]): ASTNode {
	let pos = 0;
	let depth = 0;

	function peek(): Token {
		const token = tokens[pos];
		if (!token) {
			throw new ExpressionError("Unexpected end of expression");
		}
		return token;
	}

	function advance(): Token {
		const token = peek();
		pos++;
		return token;
	}

	function expect(type: TokenType): Token {
		const token = peek();
		if (token.type !== type) {
			throw new ExpressionError(`Expected ${type} but got ${token.type}`, token.position);
		}
		return advance();
	}

	function parseExpression(precedence: Precedence): ASTNode {
		depth++;
		if (depth > MAX_AST_DEPTH) {
			throw new ExpressionError("Expression too deeply nested");
		}

		let left = parsePrefix();

		while (precedence < getInfixPrecedence(peek().type)) {
			left = parseInfix(left);
		}

		depth--;
		return left;
	}

	function parsePrefix(): ASTNode {
		const token = advance();

		switch (token.type) {
			case TokenType.Number:
				return { type: "Literal", value: Number(token.value) };

			case TokenType.String:
				return { type: "Literal", value: token.value };

			case TokenType.Boolean:
				return { type: "Literal", value: token.value === "true" };

			case TokenType.Null:
				return { type: "Literal", value: null };

			case TokenType.Identifier:
				return { type: "Identifier", name: token.value };

			case TokenType.Bang: {
				const operand = parseExpression(Precedence.Unary);
				return { type: "UnaryExpression", operator: "!", operand };
			}

			case TokenType.LeftParen: {
				const expr = parseExpression(Precedence.None);
				expect(TokenType.RightParen);
				return expr;
			}

			default:
				throw new ExpressionError(`Unexpected token: ${token.type}`, token.position);
		}
	}

	function parseInfix(left: ASTNode): ASTNode {
		const token = peek();

		switch (token.type) {
			case TokenType.EqualEqual:
			case TokenType.BangEqual:
			case TokenType.Less:
			case TokenType.Greater:
			case TokenType.LessEqual:
			case TokenType.GreaterEqual:
			case TokenType.AmpAmp:
			case TokenType.PipePipe: {
				const prec = getInfixPrecedence(token.type);
				advance();
				const right = parseExpression(prec);
				return {
					type: "BinaryExpression",
					operator: token.value,
					left,
					right,
				};
			}

			case TokenType.Dot: {
				advance(); // consume dot
				const propToken = expect(TokenType.Identifier);

				// Check if this is a method call: identifier followed by LeftParen
				if (peek().type === TokenType.LeftParen) {
					advance(); // consume '('
					const args: ASTNode[] = [];
					if (peek().type !== TokenType.RightParen) {
						args.push(parseExpression(Precedence.None));
						while (peek().type === TokenType.Comma) {
							advance(); // consume ','
							args.push(parseExpression(Precedence.None));
						}
					}
					expect(TokenType.RightParen);
					return {
						type: "CallExpression",
						callee: left,
						property: propToken.value,
						args,
					};
				}

				return {
					type: "MemberExpression",
					object: left,
					property: propToken.value,
				};
			}

			case TokenType.Question: {
				advance(); // consume '?'
				const consequent = parseExpression(Precedence.None);
				expect(TokenType.Colon);
				const alternate = parseExpression(Precedence.Ternary);
				return {
					type: "ConditionalExpression",
					test: left,
					consequent,
					alternate,
				};
			}

			default:
				throw new ExpressionError(`Unexpected infix token: ${token.type}`, token.position);
		}
	}

	const result = parseExpression(Precedence.None);

	if (peek().type !== TokenType.EOF) {
		throw new ExpressionError(`Unexpected token after expression: ${peek().type}`, peek().position);
	}

	return result;
}
