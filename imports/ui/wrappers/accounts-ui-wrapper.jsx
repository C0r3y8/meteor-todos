import React, { PureComponent } from 'react';

import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';

export default class AccountsUIWrapper extends PureComponent {
  constructor(props) {
    super(props);

    this.spanContainer = null;
  }
  componentDidMount() {
    this.view = Blaze.render(Template.loginButtons, this.spanContainer);
  }

  componentWillUnmount() {
    Blaze.remove(this.view);
  }

  render() {
    return <span ref={(c) => { this.spanContainer = c; }} />;
  }
}
