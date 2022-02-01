import React, { PureComponent } from 'react'
import styled, { css, keyframes } from 'styled-components'
import styles, { fonts } from 'src/dashboard-refactor/styles'
import colors from 'src/dashboard-refactor/colors'
import { Icon } from 'src/dashboard-refactor/styled-components'
import Margin from 'src/dashboard-refactor/components/Margin'
import {
    ListSource,
    DropReceivingState,
    SelectedState,
} from 'src/dashboard-refactor/types'
import { Props as EditableItemProps } from './sidebar-editable-item'
import { ListData, ListNameHighlightIndices } from '../types'
import * as icons from 'src/common-ui/components/design-library/icons'
import { ClickAway } from 'src/util/click-away-wrapper'
import SpaceContextMenuButton from './space-context-menu'
import { UIElementServices } from '@worldbrain/memex-common/lib/services/types'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'

export interface Props {
    className?: string
    isEditing?: boolean
    newItemsCount?: number
    name: string
    listId: number
    listData?: ListData
    source?: ListSource
    hasActivity?: boolean
    isMenuDisplayed?: boolean
    isCollaborative?: boolean
    nameHighlightIndices?: ListNameHighlightIndices
    onUnfollowClick?: React.MouseEventHandler
    onRenameClick?: React.MouseEventHandler
    onDeleteClick?: React.MouseEventHandler
    onShareClick?: React.MouseEventHandler
    dropReceivingState?: DropReceivingState
    editableProps?: EditableItemProps
    selectedState: SelectedState
    onMoreActionClick?: (listId: number) => void
    services?: UIElementServices<'contentSharing' | 'overlay' | 'clipboard'>
    shareList?: () => Promise<{ listId: string }>
}

export default class ListsSidebarItemWithMenu extends PureComponent<Props> {
    private handleSelection: React.MouseEventHandler = (e) =>
        this.props.selectedState.onSelection(this.props.listId)

    private handleMoreActionClick: React.MouseEventHandler = (e) => {
        e.stopPropagation()
        this.props.onMoreActionClick(this.props.listId)
    }

    private handleDragEnter: React.DragEventHandler = (e) => {
        e.preventDefault()
        // Needed to push this op back on the event queue, so it fires after the previous
        //  list item's `onDropLeave` event
        setTimeout(() => this.props.dropReceivingState?.onDragEnter(), 0)
    }

    private handleDrop: React.DragEventHandler = (e) => {
        e.preventDefault()
        if (!this.props.dropReceivingState?.canReceiveDroppedItems) {
            return
        }
        this.props.dropReceivingState?.onDrop(e.dataTransfer)
    }

    private renderIcon() {
        const {
            dropReceivingState,
            onMoreActionClick,
            newItemsCount,
            hasActivity,
        } = this.props

        if (hasActivity) {
            return <ActivityBeacon />
        }

        if (newItemsCount) {
            return (
                <NewItemsCount>
                    <NewItemsCountInnerDiv>
                        {newItemsCount}
                    </NewItemsCountInnerDiv>
                </NewItemsCount>
            )
        }

        if (dropReceivingState?.wasPageDropped) {
            return <Icon heightAndWidth="12px" path={icons.check} />
        }

        if (
            dropReceivingState?.canReceiveDroppedItems &&
            dropReceivingState?.isDraggedOver
        ) {
            return <Icon heightAndWidth="12px" path={icons.plus} />
        }

        if (onMoreActionClick) {
            return <SpaceContextMenuButton {...this.props} />
        }
    }

    private renderTitle() {
        const { dropReceivingState } = this.props

        const collaborationIcon = this.props.isCollaborative && (
            <Icon heightAndWidth="12px" path={icons.shared} />
        )

        if (!this.props.nameHighlightIndices) {
            return (
                <ListTitle
                    selectedState={this.props.selectedState}
                    dropReceivingState={dropReceivingState}
                    onDragLeave={dropReceivingState?.onDragLeave}
                    onDragEnter={this.handleDragEnter}
                    onDragOver={(e) => e.preventDefault()} // Needed to allow the `onDrop` event to fire
                    onDrop={this.handleDrop}
                    {...this.props}
                >
                    <Name>{this.props.name}</Name>
                    {collaborationIcon}
                </ListTitle>
            )
        }

        const [from, to] = this.props.nameHighlightIndices

        const [namePre, nameHighlighted, namePost] = [
            this.props.name.slice(0, from),
            this.props.name.slice(from, to),
            this.props.name.slice(to),
        ]

        return (
            <ListTitle selectedState={this.props.selectedState}>
                {namePre.length > 0 && <span>{namePre}</span>}
                <span style={{ fontWeight: fonts.primary.weight.bold }}>
                    {nameHighlighted}
                </span>
                {namePost.length > 0 && <span>{namePost}</span>}
                {collaborationIcon}
            </ListTitle>
        )
    }

    render() {
        const {
            dropReceivingState,
            isMenuDisplayed,
            selectedState,
            newItemsCount,
            hasActivity,
        } = this.props

        return (
            <Container>
                <SidebarItem
                    isMenuDisplayed={isMenuDisplayed}
                    selectedState={selectedState}
                    dropReceivingState={dropReceivingState}
                    //title={this.props.name}
                    onClick={this.handleSelection}
                    onDragEnter={this.handleDragEnter}
                    {...this.props}
                >
                    {dropReceivingState?.isDraggedOver && (
                        <DropZoneMask
                            dropReceivingState={dropReceivingState}
                            onDragLeave={dropReceivingState?.onDragLeave}
                            onDragEnter={this.handleDragEnter}
                            onDragOver={(e) => e.preventDefault()} // Needed to allow the `onDrop` event to fire
                            onDrop={this.handleDrop}
                            onClick={this.handleSelection}
                        />
                    )}

                    <TitleBox {...this.props}> {this.renderTitle()}</TitleBox>

                    <IconBox
                        dropReceivingState={dropReceivingState}
                        newItemsCount={newItemsCount}
                        hasActivity={hasActivity}
                        // onClick={this.handleMoreActionClick}

                        right="10px"
                    >
                        {this.renderIcon()}
                    </IconBox>
                </SidebarItem>
            </Container>
        )
    }
}

const Container = styled.div`
    position: relative;
`

const Name = styled.div`
    display: block;
    overflow-x: hidden;
    text-overflow: ellipsis;
    padding-right: 5px;
    color: ${(props) => props.theme.colors.normalText};
`

const MenuContainer = styled.div`
    display: 'flex';
    flex-direction: 'column';
    width: min-content;
    position: absolute;
    background-color: ${colors.white};
    box-shadow: ${styles.boxShadow.overlayElement};
    border-radius: ${styles.boxShadow.overlayElement};
    left: 105px;
    top: 30px;
    z-index: 1;
`

const IconBox = styled.div<Props>`
    display: ${(props) =>
        props.hasActivity ||
        props.newItemsCount ||
        props.dropReceivingState?.isDraggedOver ||
        props.dropReceivingState?.wasPageDropped
            ? 'flex'
            : 'None'};
    height: 100%;
    align-items: center;
    justify-content: flex-end;
    padding-right: 10px;
    padding-left: 5px;
`

const DropZoneMask = styled.div`
    height: inherit;
    width: inherit;
    position: absolute;
`

const TitleBox = styled.div<Props>`
    display: flex;
    flex: 0 1 100%;
    width: 91%;
    height: 100%;
    padding-left: ${(props) =>
        props.listId === SPECIAL_LIST_IDS.INBOX ||
        props.listId === SPECIAL_LIST_IDS.MOBILE
            ? '35px'
            : '25px'};
    align-items: center;
    color: ${(props) => props.theme.colors.normalText};
`

const SidebarItem = styled.div<Props>`
 height: ${(props) =>
     props.listId === SPECIAL_LIST_IDS.INBOX ||
     props.listId === SPECIAL_LIST_IDS.MOBILE
         ? '30px'
         : '40px'};
 margin-top:  ${(props) =>
     props.listId === SPECIAL_LIST_IDS.INBOX ||
     props.listId === SPECIAL_LIST_IDS.MOBILE
         ? '-3px'
         : '0px'};
    margin-bottom:  ${(props) =>
        props.listId === SPECIAL_LIST_IDS.INBOX ||
        props.listId === SPECIAL_LIST_IDS.MOBILE
            ? '5px'
            : '0px'};
 width: 100%;
 display: flex;
 flex-direction: row;
 justify-content: space-between;
 align-items: center;
 background-color: transparent;
  
 &:hover {
    background-color: ${(props) => props.theme.colors.lightHover};
 }

  

 ${({ isMenuDisplayed, dropReceivingState }) =>
     css`
         background-color: ${isMenuDisplayed ||
         (dropReceivingState?.canReceiveDroppedItems &&
             dropReceivingState?.isDraggedOver)
             ? `${(props) => props.theme.colors.lightHover}`
             : `transparent`};
     `};

  

 &:hover ${IconBox} {

 display: ${(props) =>
     !props.dropReceivingState?.isDraggedOver ? 'flex' : 'None'};

 }

  

 &:hover ${TitleBox} {

 width: 70%;

 }

  

 ${({ selectedState }: Props) =>
     selectedState?.isSelected &&
     css`
         color: ${(props) => props.theme.colors.darkText};
     `}

  

 ${({ dropReceivingState }: Props) =>
     dropReceivingState?.wasPageDropped &&
     css`
         animation: ${blinkingAnimation} 0.2s 2;
     `}

  

 cursor: ${({ dropReceivingState }: Props) =>
     !dropReceivingState?.isDraggedOver
         ? `pointer`
         : dropReceivingState?.canReceiveDroppedItems
         ? `pointer`
         : `not-allowed`};

`

const MenuButton = styled.div`
    height: 34px;
    width: 100%;
    font-family: ${fonts.primary.name};
    font-weight: ${fonts.primary.weight.normal};
    font-size: 14px;
    line-height: 18px;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    cursor: pointer;
    padding: 0px 10px 0 0;
    &: ${SidebarItem} {
        background-color: red;
    }
    &:hover {
        background-color: ${(props) => props.theme.colors.lightHover};
    }
    & > div {
        width: auto;
    }
`

const ListTitle = styled.span<Props>`
    display: flex;
    align-items: center;
    margin: 0;
    font-family: ${fonts.primary.name};
    font-weight: 400;
    font-style: normal;
    ${({ selectedState }: Props) =>
        selectedState.isSelected && `font-weight: 600;`}
    font-size:  ${(props) =>
        props.listId === SPECIAL_LIST_IDS.INBOX ||
        props.listId === SPECIAL_LIST_IDS.MOBILE
            ? '14px'
            : '14px'};
    line-height: 18px;
    height: 18px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 20px;
    justify-content: flex-start;
    width: 100%;
    pointer-events: none;
`

const ActivityBeacon = styled.div`
    width: 14px;
    height: 14px;
    border-radius: 10px;
    padding: 8px;
    background-color: ${(props) => props.theme.colors.purple};
`

const NewItemsCount = styled.div`
    width: 30px;
    height: 16px;
    border-radius: 10px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    background-color: ${(props) => props.theme.colors.purple};
    padding: 2px 5px;
    color: white;
    text-align: center;
    font-weight: 600;
    justify-content: center;
`

const NewItemsCountInnerDiv = styled.div`
    font-family: ${fonts.primary.name};
    font-weight: 500;
    font-size: 12px;
    line-height: 14px;
    padding: 2px 0px;
`

// probably want to use timing function to get this really looking good. This is just quick and dirty

const blinkingAnimation = keyframes`
 0% {
 background-color: ${colors.onHover};
 }
 50% {
 background-color: transparent;
 }
 100% {
 background-color: ${colors.onHover};
 }
`
