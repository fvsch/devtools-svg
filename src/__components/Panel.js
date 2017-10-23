import React from 'react'

export default class Panel extends React.Component {
  render() {
    return (
      <div className="Panel">
        Hello world
        {/* <Toolbar />
        <Content>
          <h1>Hello {{ title }}!</h1>
        </Content>
        <Sidebar /> */}
      </div>
    )
  }
}

/*
<script>
  import "./Panel.css";
  import Toolbar from './Toolbar.html';
  import Content from './Content.html';
  import Sidebar from './Sidebar.html';

  export default {
    components: {
      Toolbar,
      Content,
      Sidebar
    },
    data() {
      return {
        title: store.title
      }
    }
  }
</script>
*/
