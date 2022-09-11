/**
 * @fileoverview Prevent problematic leaked values from being rendered
 * @author Mario Beltrán
 */

'use strict';

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const RuleTester = require('eslint').RuleTester;
const rule = require('../../../lib/rules/jsx-no-leaked-render');

const parsers = require('../../helpers/parsers');

const parserOptions = {
  ecmaVersion: 2018,
  sourceType: 'module',
  ecmaFeatures: {
    jsx: true,
  },
};

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({ parserOptions });
ruleTester.run('jsx-no-leaked-render', rule, {
  valid: parsers.all([
    {
      code: `
        const Component = () => {
          return <div>{customTitle || defaultTitle}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ elements }) => {
          return <div>{elements}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ elements }) => {
          return <div>There are {elements.length} elements</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ elements, count }) => {
          return <div>{!count && 'No results found'}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ elements }) => {
          return <div>{!!elements.length && <List elements={elements}/>}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ elements }) => {
          return <div>{Boolean(elements.length) && <List elements={elements}/>}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ elements }) => {
          return <div>{elements.length > 0 && <List elements={elements}/>}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ elements }) => {
          return <div>{elements.length ? <List elements={elements}/> : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ elements, count }) => {
          return <div>{count ? <List elements={elements}/> : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ elements, count }) => {
          return <div>{count ? <List elements={elements}/> : null}</div>
        }
      `,
      options: [{ validStrategies: ['ternary'] }],
    },
    {
      code: `
        const Component = ({ elements, count }) => {
          return <div>{!!count && <List elements={elements}/>}</div>
        }
      `,
      options: [{ validStrategies: ['coerce'] }],
    },
    {
      code: `
        const Component = ({ elements, count }) => {
          return <div>{count ? <List elements={elements}/> : null}</div>
        }
      `,
      options: [{ validStrategies: ['coerce', 'ternary'] }],
    },
    {
      code: `
        const Component = ({ elements, count }) => {
          return <div>{!!count && <List elements={elements}/>}</div>
        }
      `,
      options: [{ validStrategies: ['coerce', 'ternary'] }],
    },
    {
      code: `
        const Component = ({ elements, count }) => {
          return <div>{!!count && <List elements={elements}/>}</div>
        }
      `,
      options: [{ validStrategies: ['coerce'] }],
    },

    // Fixes for:
    // - https://github.com/jsx-eslint/eslint-plugin-react/issues/3292
    // - https://github.com/jsx-eslint/eslint-plugin-react/issues/3297
    {
      // It shouldn't delete valid alternate from ternary expressions when "coerce" is the only valid strategy
      code: `
        const Component = ({ elements, count }) => {
          return (
            <div>
              <div> {direction ? (direction === "down" ? "▼" : "▲") : ""} </div>
              <div>{ containerName.length > 0 ? "Loading several stuff" : "Loading" }</div>
            </div>
          )
        }
      `,
      options: [{ validStrategies: ['coerce'] }],
    },
    {
      // It shouldn't delete valid branches from ternary expressions when ["coerce", "ternary"] are only valid strategies
      code: `
        const Component = ({ elements, count }) => {
          return <div>{direction ? (direction === "down" ? "▼" : "▲") : ""}</div>
        }
      `,
      options: [{ validStrategies: ['coerce', 'ternary'] }],
    },
    {
      // It shouldn't report nested logical expressions when "coerce" is the only valid strategy
      code: `
        const Component = ({ direction }) => {
          return (
            <div>
              <div>{!!direction && direction === "down" && "▼"}</div>
              <div>{direction === "down" && !!direction && "▼"}</div>
              <div>{direction === "down" || !!direction && "▼"}</div>
              <div>{(!display || display === DISPLAY.WELCOME) && <span>foo</span>}</div>
            </div>
          )
        }
      `,
      options: [{ validStrategies: ['coerce'] }],
    },
    // Fixes for:
    // - https://github.com/jsx-eslint/eslint-plugin-react/issues/3354
    {
      code: `
        const Component = ({ elements, count }) => {
          return <div>{count ? <List elements={elements}/> : <EmptyList />}</div>
        }
      `,
      options: [{ validStrategies: ['coerce', 'ternary'] }],
    },
    {
      code: `
        const Component = ({ elements, count }) => {
          return <div>{count ? <List elements={elements}/> : <EmptyList />}</div>
        }
      `,
      options: [{ validStrategies: ['coerce'] }],
    },
  ]),

  invalid: parsers.all([
    // Common invalid cases with default options
    {
      code: `
      const Example = () => {
        return (
          <>
            {0 && <Something/>}
            {'' && <Something/>}
            {NaN && <Something/>}
          </>
        )
      }
      `,
      features: ['fragment'],
      errors: [
        {
          message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
          line: 5,
          column: 14,
        },
        {
          message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
          line: 6,
          column: 14,
        },
        {
          message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
          line: 7,
          column: 14,
        },
      ],
      output: `
      const Example = () => {
        return (
          <>
            {0 ? <Something/> : null}
            {'' ? <Something/> : null}
            {NaN ? <Something/> : null}
          </>
        )
      }
      `,
    },

    // Invalid tests with both strategies enabled (default)
    {
      code: `
        const Component = ({ count, title }) => {
          return <div>{count && title}</div>
        }
      `,
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ count, title }) => {
          return <div>{count ? title : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ count }) => {
          return <div>{count && <span>There are {count} results</span>}</div>
        }
      `,
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ count }) => {
          return <div>{count ? <span>There are {count} results</span> : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ elements }) => {
          return <div>{elements.length && <List elements={elements}/>}</div>
        }
      `,
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ elements }) => {
          return <div>{elements.length ? <List elements={elements}/> : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ nestedCollection }) => {
          return <div>{nestedCollection.elements.length && <List elements={nestedCollection.elements}/>}</div>
        }
      `,
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ nestedCollection }) => {
          return <div>{nestedCollection.elements.length ? <List elements={nestedCollection.elements}/> : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ elements }) => {
          return <div>{elements[0] && <List elements={elements}/>}</div>
        }
      `,
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ elements }) => {
          return <div>{elements[0] ? <List elements={elements}/> : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ numberA, numberB }) => {
          return <div>{(numberA || numberB) && <Results>{numberA+numberB}</Results>}</div>
        }
      `,
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ numberA, numberB }) => {
          return <div>{(numberA || numberB) ? <Results>{numberA+numberB}</Results> : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ numberA, numberB }) => {
          return <div>{(numberA || numberB) && <Results>{numberA+numberB}</Results>}</div>
        }
      `,
      options: [{ validStrategies: ['coerce', 'ternary'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ numberA, numberB }) => {
          return <div>{!!(numberA || numberB) && <Results>{numberA+numberB}</Results>}</div>
        }
      `,
    },

    // Invalid tests only with "ternary" strategy enabled
    {
      code: `
        const Component = ({ count, title }) => {
          return <div>{count && title}</div>
        }
      `,
      options: [{ validStrategies: ['ternary'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ count, title }) => {
          return <div>{count ? title : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ count }) => {
          return <div>{count && <span>There are {count} results</span>}</div>
        }
      `,
      options: [{ validStrategies: ['ternary'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ count }) => {
          return <div>{count ? <span>There are {count} results</span> : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ elements }) => {
          return <div>{elements.length && <List elements={elements}/>}</div>
        }
      `,
      options: [{ validStrategies: ['ternary'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ elements }) => {
          return <div>{elements.length ? <List elements={elements}/> : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ nestedCollection }) => {
          return <div>{nestedCollection.elements.length && <List elements={nestedCollection.elements}/>}</div>
        }
      `,
      options: [{ validStrategies: ['ternary'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ nestedCollection }) => {
          return <div>{nestedCollection.elements.length ? <List elements={nestedCollection.elements}/> : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ elements }) => {
          return <div>{elements[0] && <List elements={elements}/>}</div>
        }
      `,
      options: [{ validStrategies: ['ternary'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ elements }) => {
          return <div>{elements[0] ? <List elements={elements}/> : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ numberA, numberB }) => {
          return <div>{(numberA || numberB) && <Results>{numberA+numberB}</Results>}</div>
        }
      `,
      options: [{ validStrategies: ['ternary'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ numberA, numberB }) => {
          return <div>{(numberA || numberB) ? <Results>{numberA+numberB}</Results> : null}</div>
        }
      `,
    },

    // cases: boolean coerce isn't valid if strategy is only "ternary"
    {
      code: `
        const Component = ({ someCondition, title }) => {
          return <div>{!someCondition && title}</div>
        }
      `,
      options: [{ validStrategies: ['ternary'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ someCondition, title }) => {
          return <div>{!someCondition ? title : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ count, title }) => {
          return <div>{!!count && title}</div>
        }
      `,
      options: [{ validStrategies: ['ternary'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ count, title }) => {
          return <div>{count ? title : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ count, title }) => {
          return <div>{count > 0 && title}</div>
        }
      `,
      options: [{ validStrategies: ['ternary'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ count, title }) => {
          return <div>{count > 0 ? title : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ count, title }) => {
          return <div>{0 != count && title}</div>
        }
      `,
      options: [{ validStrategies: ['ternary'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ count, title }) => {
          return <div>{0 != count ? title : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ count, total, title }) => {
          return <div>{count < total && title}</div>
        }
      `,
      options: [{ validStrategies: ['ternary'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ count, total, title }) => {
          return <div>{count < total ? title : null}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ count, title, somethingElse }) => {
          return <div>{!!(count && somethingElse) && title}</div>
        }
      `,
      options: [{ validStrategies: ['ternary'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ count, title, somethingElse }) => {
          return <div>{count && somethingElse ? title : null}</div>
        }
      `,
    },

    // Invalid tests only with "coerce" strategy enabled
    {
      code: `
        const Component = ({ count, title }) => {
          return <div>{count && title}</div>
        }
      `,
      options: [{ validStrategies: ['coerce'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ count, title }) => {
          return <div>{!!count && title}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ count }) => {
          return <div>{count && <span>There are {count} results</span>}</div>
        }
      `,
      options: [{ validStrategies: ['coerce'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ count }) => {
          return <div>{!!count && <span>There are {count} results</span>}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ elements }) => {
          return <div>{elements.length && <List elements={elements}/>}</div>
        }
      `,
      options: [{ validStrategies: ['coerce'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ elements }) => {
          return <div>{!!elements.length && <List elements={elements}/>}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ nestedCollection }) => {
          return <div>{nestedCollection.elements.length && <List elements={nestedCollection.elements}/>}</div>
        }
      `,
      options: [{ validStrategies: ['coerce'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ nestedCollection }) => {
          return <div>{!!nestedCollection.elements.length && <List elements={nestedCollection.elements}/>}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ elements }) => {
          return <div>{elements[0] && <List elements={elements}/>}</div>
        }
      `,
      options: [{ validStrategies: ['coerce'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ elements }) => {
          return <div>{!!elements[0] && <List elements={elements}/>}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ numberA, numberB }) => {
          return <div>{(numberA || numberB) && <Results>{numberA+numberB}</Results>}</div>
        }
      `,
      options: [{ validStrategies: ['coerce'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ numberA, numberB }) => {
          return <div>{!!(numberA || numberB) && <Results>{numberA+numberB}</Results>}</div>
        }
      `,
    },

    // cases: ternary isn't valid if strategy is only "coerce"
    {
      code: `
        const Component = ({ count, title }) => {
          return <div>{count ? title : null}</div>
        }
      `,
      options: [{ validStrategies: ['coerce'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ count, title }) => {
          return <div>{!!count && title}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ count, title }) => {
          return <div>{!count ? title : null}</div>
        }
      `,
      options: [{ validStrategies: ['coerce'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ count, title }) => {
          return <div>{!count && title}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ count, somethingElse, title }) => {
          return <div>{count && somethingElse ? title : null}</div>
        }
      `,
      options: [{ validStrategies: ['coerce'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ count, somethingElse, title }) => {
          return <div>{!!count && !!somethingElse && title}</div>
        }
      `,
    },
    {
      code: `
        const Component = ({ items, somethingElse, title }) => {
          return <div>{items.length > 0 && somethingElse && title}</div>
        }
      `,
      options: [{ validStrategies: ['coerce'] }],
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 3,
        column: 24,
      }],
      output: `
        const Component = ({ items, somethingElse, title }) => {
          return <div>{items.length > 0 && !!somethingElse && title}</div>
        }
      `,
    },
    {
      code: `
        const MyComponent = () => {
          const items = []
          const breakpoint = { phones: true }
        
          return <div>{items.length > 0 && breakpoint.phones && <span />}</div>
        }
      `,
      options: [{ validStrategies: ['coerce', 'ternary'] }],
      output: `
        const MyComponent = () => {
          const items = []
          const breakpoint = { phones: true }
        
          return <div>{items.length > 0 && !!breakpoint.phones && <span />}</div>
        }
      `,
      errors: [{
        message: 'Potential leaked value that might cause unintentionally rendered values or rendering crashes',
        line: 6,
        column: 24,
      }],
    },
  ]),
});
