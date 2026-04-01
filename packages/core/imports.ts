import type { LogicSpec } from "./types.js";

export interface ImportError {
	type: "file_not_found" | "parse_error" | "circular_import" | "merge_error";
	message: string;
	chain: string[];
}

export interface ImportSuccess {
	ok: true;
	data: LogicSpec;
}

export interface ImportFailure {
	ok: false;
	errors: ImportError[];
}

export type ImportResult = ImportSuccess | ImportFailure;

export function resolveImports(_spec: LogicSpec, _basedir: string): ImportResult {
	return {
		ok: false,
		errors: [{ type: "merge_error", message: "Not implemented", chain: [] }],
	};
}
