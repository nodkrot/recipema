import React, { Component } from 'react'
import List from 'antd/lib/list'
// import Button from 'antd/lib/button'
import './styles.css'

export default class RecipeList extends Component {

  // constructor(props) {
  //   super(props)

  //   this.handleLoadMore = this.handleLoadMore.bind(this)
  // }

  // handleLoadMore() {
  //   this.prop.onLoadMore()
  // }

  render() {
    // const { initLoading, loading, list } = this.state;
    // const loadMore = !initLoading && !loading ? (
    //   <div style={{ textAlign: 'center', marginTop: 12, height: 32, lineHeight: '32px' }}>
    //     <Button onClick={this.handleLoadMore}>loading more</Button>
    //   </div>
    // ) : null;

    return (
      <List
        className="recipe-list"
        bordered
        itemLayout="horizontal"
        dataSource={this.props.recipes}
        renderItem={item => (
          <List.Item actions={[
            <a key={1} onClick={() => this.props.onEdit(item)}>edit</a>,
            <a key={2} onClick={() => this.props.onRemove(item)}>remove</a>
          ]}>
            <List.Item.Meta
              title={item.name}
              description={item.description}
            />
          </List.Item>
        )}
      />
    )
  }
}
