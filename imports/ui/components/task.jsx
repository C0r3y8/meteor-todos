import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import classnames from 'classnames';

import { Meteor } from 'meteor/meteor';

export default class Task extends PureComponent {
  static propTypes = {
    showPrivateButton: PropTypes.bool.isRequired,
    task: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.deleteThisTask = this.deleteThisTask.bind(this);
    this.toggleChecked = this.toggleChecked.bind(this);
    this.togglePrivate = this.togglePrivate.bind(this);
  }

  deleteThisTask() {
    Meteor.call('tasks.remove', this.props.task._id);
  }

  toggleChecked() {
    const { task } = this.props;

    Meteor.call('tasks.setChecked', task._id, !task.checked);
  }

  togglePrivate() {
    const { task } = this.props;

    Meteor.call('tasks.setPrivate', task._id, !task.private);
  }

  render() {
    const {
      deleteThisTask,
      props: {
        showPrivateButton,
        task
      },
      toggleChecked,
      togglePrivate
    } = this;

    const taskClassName = classnames({
      checked: task.checked,
      private: task.private
    });

    return (
      <li className={taskClassName}>
        <button className="delete" onClick={deleteThisTask}>
          &times;
        </button>

        <input
          checked={task.checked}
          onClick={toggleChecked}
          readOnly
          type="checkbox"
        />

        {
          showPrivateButton ? (
            <button className="toggle-private" onClick={togglePrivate}>
              { task.private ? 'Private' : 'Public' }
            </button>
          ) : ''
        }

        <span className="text">
          <strong>{task.username}</strong>
          {`: ${task.text}`}
        </span>
      </li>
    );
  }
}
