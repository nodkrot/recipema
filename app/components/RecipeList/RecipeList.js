import React, { Component } from 'react'
import PropTypes from 'prop-types'
import List from 'antd/lib/list'
import Modal from 'antd/lib/modal'
import Messages from '../../messages.json'
// import Button from 'antd/lib/button'
import './styles.css'

const messages = Messages['ru_RU']
const confirm = Modal.confirm

export default class RecipeList extends Component {

  // constructor(props) {
  //   super(props)

  //   this.handleLoadMore = this.handleLoadMore.bind(this)
  // }

  // handleLoadMore() {
  //   this.prop.onLoadMore()
  // }

  handleRemove(item) {
    confirm({
      title: messages.modal_remove_title.replace('$a', item.name),
      onOk: () => {
        this.props.onRemove(item)
      },
      onCancel() {},
    })
  }

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
            <a key={1} onClick={() => this.props.onEdit(item)}>{messages.recipe_list_edit}</a>,
            <a key={2} onClick={() => this.handleRemove(item)}>{messages.recipe_list_remove}</a>
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

RecipeList.propTypes = {
  recipes: PropTypes.array,
  onEdit: PropTypes.func,
  onRemove: PropTypes.func
}
