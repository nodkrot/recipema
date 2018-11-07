import React, { Component } from 'react'
import PropTypes from 'prop-types'
import List from 'antd/lib/list'
import Modal from 'antd/lib/modal'
import Button from 'antd/lib/button'
import Messages from '../../messages.json'
import './styles.css'

const messages = Messages['ru_RU']
const confirm = Modal.confirm

function trimString(str, length = 60) {
  return str.length > length ? str.substring(0, length) + '...' : str
}

export default class RecipeList extends Component {

  handleRemove(item) {
    confirm({
      title: messages.modal_remove_title.replace('$a', item.name),
      onOk: () => this.props.onRemove(item),
      onCancel() {},
    })
  }

  render() {
    return (
      <List
        className="recipe-list"
        bordered
        itemLayout="horizontal"
        dataSource={this.props.recipes}
        renderItem={item => (
          <List.Item actions={[
            <Button key="1" shape="circle" icon="edit" size="large" onClick={() => this.props.onEdit(item)} />,
            <Button key="2" shape="circle" icon="delete" size="large" onClick={() => this.handleRemove(item)} />
          ]}>
            <List.Item.Meta
              title={item.name}
              description={trimString(item.description)}
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
