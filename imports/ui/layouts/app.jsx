import React, { Component, PropTypes } from 'react';

import { Meteor } from 'meteor/meteor';

import Task from '../components/task';
import AccountsUIWrapper from '../wrappers/accounts-ui-wrapper';

export default class App extends Component {
  static defaultProps = { currentUser: null };

  static propTypes = {
    currentUser: PropTypes.object,
    incompleteCount: PropTypes.number.isRequired,
    tasks: PropTypes.array.isRequired
  };

  constructor(props) {
    super(props);

    this.state = { hideCompleted: false };

    this.inputAddTask = null;

    this.handleSubmit = this.handleSubmit.bind(this);
    this.renderTasks = this.renderTasks.bind(this);
    this.toggleHideCompleted = this.toggleHideCompleted.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();

    Meteor.call('tasks.insert', this.inputAddTask.value.trim());

    this.inputAddTask.value = '';
  }

  toggleHideCompleted() {
    this.setState({ hideCompleted: !this.state.hideCompleted });
  }

  renderTasks() {
    const {
      props: {
        currentUser,
        tasks
      },
      state: { hideCompleted }
    } = this;

    let filteredTasks = tasks;
    if (hideCompleted) {
      filteredTasks = filteredTasks.filter(task => !task.checked);
    }

    return filteredTasks.map((task) => {
      const currentUserId = currentUser && currentUser._id;
      const showPrivateButton = task.owner === currentUserId;

      return (
        <Task
          key={task._id}
          showPrivateButton={showPrivateButton}
          task={task}
        />
      );
    });
  }

  render() {
    const {
      handleSubmit,
      props: {
        currentUser,
        incompleteCount
      },
      renderTasks,
      state: { hideCompleted },
      toggleHideCompleted
    } = this;

    return (
      <div className="container">
        <header>
          <h1>{`Todo List (${incompleteCount})`}</h1>

          <label className="hide-completed" htmlFor="hideCompleted">
            <input
              name="hideCompleted"
              checked={hideCompleted}
              onClick={toggleHideCompleted}
              readOnly
              type="checkbox"
            />
            {'Hide Completed Tasks'}
          </label>

          <AccountsUIWrapper />

          {
            currentUser ? (
              <form className="new-task" onSubmit={handleSubmit} >
                <input
                  placeholder="Type to add new tasks"
                  ref={(input) => { this.inputAddTask = input; }}
                  type="text"
                />
              </form>
            ) : ''
          }
        </header>

        <ul>{renderTasks()}</ul>
      </div>
    );
  }
}
