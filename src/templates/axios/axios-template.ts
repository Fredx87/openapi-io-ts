import Handelbars from "handlebars";

const helloWorldTemplate = Handelbars.compile(`
    function({{#each inputArgs}}{{this}}, {{/each}}) {}
`);
export const helloWorldGen = (inputArgs: string[]) =>
  helloWorldTemplate({ inputArgs });
