import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { reduxPageSetName } from '../../actions/redux-page-actions';

class ReduxPage extends PureComponent {
  static propTypes = {
    handleChange: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired
  }

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.props.handleChange(event.target.value);
  }

  handleSubmit(event) {
    event.preventDefault();

    document.location = `redux?name=${this.props.name}`;
  }

  render() {
    const { name } = this.props;

    return (
      <section>
        <div>
          <form onSubmit={this.handleSubmit}>
            <input name="name" type="text" onChange={this.handleChange} />
          </form>
        </div>
        <div>
          <h1>{`Welcome, ${name}`}</h1>
        </div>
      </section>
    );
  }
}

const mapStateToProps = state => ({
  name: state.reduxPage.name
});

const mapDispatchToProps = dispatch => ({
  handleChange: (name) => {
    dispatch(reduxPageSetName(name));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(ReduxPage);
