import React, { PropTypes } from 'react';

export default function Task({ task }) {
  return (
    <li>{task.text}</li>
  );
}

Task.propTypes = {
  // This component gets the task to display through a React prop.
  // We can use propTypes to indicate it is required
  task: PropTypes.object.isRequired
};
