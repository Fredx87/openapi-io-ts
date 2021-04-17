import * as ts from "typescript";
import * as E from "fp-ts/Either";

export function formatFile(
  fileName: string,
  content: string
): E.Either<Error, string> {
  return E.tryCatch(() => {
    const languageServiceHost = new LanguageServiceHost();
    languageServiceHost.setFileContent(fileName, content);

    const languageService = ts.createLanguageService(languageServiceHost);
    organizeImports(fileName, languageService, languageServiceHost);
    formatContent(fileName, languageService, languageServiceHost);
    return languageServiceHost.getFileContent(fileName) ?? content;
  }, E.toError);
}

function organizeImports(
  fileName: string,
  languageService: ts.LanguageService,
  languageServiceHost: LanguageServiceHost
): void {
  const content = languageServiceHost.getFileContent(fileName);

  if (content) {
    const fileTextChanges = languageService.organizeImports(
      {
        type: "file",
        fileName,
      },
      {},
      undefined
    );
    languageServiceHost.setFileContent(
      fileName,
      applyTextChanges(content, fileTextChanges[0].textChanges)
    );
  }
}

function formatContent(
  fileName: string,
  languageService: ts.LanguageService,
  languageServiceHost: LanguageServiceHost
): void {
  const content = languageServiceHost.getFileContent(fileName);

  if (content) {
    const textChanges = languageService.getFormattingEditsForDocument(
      fileName,
      ts.getDefaultFormatCodeSettings()
    );

    languageServiceHost.setFileContent(
      fileName,
      applyTextChanges(content, textChanges)
    );
  }
}

function applyTextChanges(
  input: string,
  changes: readonly ts.TextChange[]
): string {
  let res = input;

  [...changes].reverse().forEach((c) => {
    const head = res.slice(0, c.span.start);
    const tail = res.slice(c.span.start + c.span.length);
    res = `${head}${c.newText}${tail}`;
  });

  return res;
}

class LanguageServiceHost implements ts.LanguageServiceHost {
  private files = new Map<string, string>();

  setFileContent(fileName: string, content: string): void {
    this.files.set(fileName, content);
  }

  getFileContent(fileName: string): string | undefined {
    return this.files.get(fileName);
  }

  getCompilationSettings(): ts.CompilerOptions {
    return ts.getDefaultCompilerOptions();
  }

  getScriptFileNames(): string[] {
    return Array.from(this.files.keys());
  }

  getScriptVersion(): string {
    return "0";
  }

  getScriptSnapshot(fileName: string): ts.IScriptSnapshot | undefined {
    const content = this.getFileContent(fileName);
    return content ? ts.ScriptSnapshot.fromString(content) : undefined;
  }

  getCurrentDirectory(): string {
    return "";
  }

  getDefaultLibFileName(options: ts.CompilerOptions): string {
    return ts.getDefaultLibFilePath(options);
  }
}
