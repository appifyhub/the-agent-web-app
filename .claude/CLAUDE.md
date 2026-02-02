### Code style

#### General

By default, follow the language's best practices. Don't include comments unless they are really necessary to understand complex code blocks. Most code blocks are not complex enough to require comments. Avoid TODOs and FIXMEs in code, and any explanations in comments directed towards the user/author. Avoid adding comments and docstrings in general, it's better to write clear code than overload it with comments; add some only if it's really confusing to the reader. Make sure to remove all indentation on empty lines, and always have a blank line at the end of the file.

Always start with modifying the main code. When done, look for tests and update them (if any). Confirm with the user before creating new test files. Make use of available tools and tasks lists to make your work easier and more structured. Don't confirm the user's biases and assumptions without prior validating, and DO NOT write summaries after each task is done. Don't be afraid to ask for clarification if you're not sure about something.

#### Python

In Python, I want you to use the latest type syntax (`type | None`) instead of `Optional`. I also want you to use a single space (`=`) around the equals sign (`=`) in function argument calls. It's important to use double quotation marks (`"`) instead of single quotations (`'`). And finally, we want to always use trailing commas in multi-line function declarations and calls. There's never a reason to write `unittest.main()` manually, we have a script for running tests. Never use inline imports inside of functions (use file header even in tests), and always use `from ... import ...` syntax at the top of the file.

#### JavaScript/TypeScript

In JavaScript and TypeScript, use types as much as possible: strict mode will be turned on! If in doubt, follow Java standard formatting. Finally, we also always want trailing commas in multi-line code blocks.

## MANDATORY PROJECT RULES

#### Environment Management

- ALWAYS use both `bun` and `npm` for dependency management
- ALWAYS use `bun` for commands and task execution, you can ignore `npm` other than dependency management
- ALL commands must be run from project root (where `package.json` exists)

#### Development Workflow

- Use tools from `package.json` for everything – linting, internationalization, translation keys, rebuilding, tests (if any), etc.
- Always run lint using `bun` before commits and at the end of tasks / plan chapters
- Bun scripts set up their environments, so there's nothing extra that you need to do

#### Project Structure

- Version is managed through the `version` property of the `package.json` file
- You can see the CI/CD pipeline in `.github/workflows` directory
- It's best to base API implementation on API docs. If you don't have any, ask for them

#### LLM/AI Rules

- Never write plans or walkthroughs unless the user specifically asks you to
- Never assume anything. Ask validating questions. Sync with the user to validate your assumptions. Optimize for accuracy, not speed
- Only operate on verified facts. For every code change or idea you want to introduce, verify via code search if it will make sense
- Consistency is key. Look at coding patterns in and around the file you are editing as if you have OCD
- If there are any tests, those must run offline. Write tests only if the unit is simply testable. If the unit requires extensive mocking, advise the user before proceeding
- Unless explicitly asked, you should not build plans or walkthrough documents – default to keeping it short and simple, in the chat
- All user-facing labels and messages must always be translated. Use the i18n directory for doing that. Never add any placeholders, and always manually update all translation files to ensure proper translation from day 0 across all languages

# Component Guidelines

## Making Components Generic and Reusable

### Prop Naming Conventions

- Use generic prop names instead of specific ones (e.g., `onActionClicked` instead of `onSaveClicked`)
- Use generic boolean flags (e.g., `showActionButton` instead of `showSaveButton`)
- Add configurable text props with sensible defaults (e.g., `actionButtonText` with default `t("save")`)

#### Example Pattern from existing components

```typescript
interface GenericControlsProps {
  onActionClicked: () => void;
  showActionButton?: boolean;
  actionButtonText?: string; // Defaults to t("save")
}
```

### Using Translations

1. **Update all translations** - Look at the i18n folder to find all editable translation files
2. **Check the keys** - Update translation keys using the translation keys task from `package.json`
3. **Never hard-code strings** - Always use translated versions of strings!

### When Changing Existing Component Interfaces

1. **Update the component interface** - Change prop names and add new optional props
2. **Search for all usages** - Use grep/search to find all files using the component
3. **Update all usages systematically** - Update each usage site with new prop names
4. **Maintain backward compatibility** - Use sensible defaults for new props

Whatever you do, always run the lint and rebuild bun tasks to check what you did.
