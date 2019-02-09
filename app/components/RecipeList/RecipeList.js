import React from 'react'
import PropTypes from 'prop-types'
import List from 'antd/lib/list'
import Button from 'antd/lib/button'
import Modal from 'antd/lib/modal'
import Messages from '../../messages.json'
import './styles.css'

const messages = Messages['ru_RU']

function trimString(str, length = 60) {
  return str.length > length ? str.substring(0, length) + '...' : str
}

export default function RecipeList({ isLoading, recipes, onEdit, onRemove }) {
  function handleRemove(item) {
    Modal.confirm({
      title: messages.modal_remove_title.replace('$a', item.name),
      onOk: () => onRemove(item)
    })
  }

  return (
    <div className="recipe-list">
      <List
        bordered
        loading={isLoading}
        itemLayout="horizontal"
        dataSource={recipes}
        renderItem={(item) => (
          <List.Item actions={[
            <Button key="1" shape="circle" icon="edit" size="large" onClick={() => onEdit(item)} />,
            <Button key="2" shape="circle" icon="delete" size="large" onClick={() => handleRemove(item)} />
          ]}>
            <List.Item.Meta
              title={item.name}
              description={trimString(item.description)}
            />
          </List.Item>
        )}
      />
      <small style={{ float: 'right' }}>Total items: {recipes.length}</small>
    </div>
  )
}

RecipeList.propTypes = {
  recipes: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired
}
