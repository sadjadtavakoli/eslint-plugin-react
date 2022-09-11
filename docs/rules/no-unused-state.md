# Disallow definitions of unused state (react/no-unused-state)

💼 This rule is enabled in the following [configs](https://github.com/jsx-eslint/eslint-plugin-react#shareable-configurations): `all`.

Warns you if you have defined a property on the state, but it is not being used anywhere.

## Rule Details

Examples of **incorrect** code for this rule:

```jsx
class MyComponent extends React.Component {
  state = { foo: 0 };
  render() {
    return <SomeComponent />;
  }
}

var UnusedGetInitialStateTest = createReactClass({
  getInitialState: function() {
    return { foo: 0 };
  },
  render: function() {
    return <SomeComponent />;
  }
})
```

Examples of **correct** code for this rule:

```jsx
class MyComponent extends React.Component {
  state = { foo: 0 };
  render() {
    return <SomeComponent foo={this.state.foo} />;
  }
}

var UnusedGetInitialStateTest = createReactClass({
  getInitialState: function() {
    return { foo: 0 };
  },
  render: function() {
    return <SomeComponent foo={this.state.foo} />;
  }
})
```
