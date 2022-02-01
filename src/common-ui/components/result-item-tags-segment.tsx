import React, { HTMLProps } from 'react'
import styled from 'styled-components'

import * as icons from 'src/common-ui/components/design-library/icons'

export interface Props extends Pick<HTMLProps<HTMLDivElement>, 'onMouseEnter'> {
    tags: string[]
    showEditBtn: boolean
    onTagClick?: (tag: string) => void
    onEditBtnClick: React.MouseEventHandler
}

export default function TagsSegment({
    tags,
    onTagClick,
    showEditBtn,
    onEditBtnClick,
    ...props
}: Props) {
    if (!tags?.length) {
        return null
    }

    return (
        <Container {...props}>
            <EditIconContainer onClick={onEditBtnClick}>
                <EditIcon />
            </EditIconContainer>
            <TagsContainer>
                {tags.slice(0).map((tag) => (
                    <TagPill
                        key={tag}
                        onClick={onTagClick ? () => onTagClick(tag) : undefined}
                    >
                        {tag}
                    </TagPill>
                ))}
            </TagsContainer>
        </Container>
    )
}

const Container = styled.div`
    display: grid;
    grid-gap: 10px;
    align-items: center;
    justify-content: flex-start;
    padding: 5px 15px;
    grid-auto-flow: column;
    border-top: 1px solid ${(props) => props.theme.colors.lineGrey};
`

const TagsContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
`

const TagPill = styled.div`
    background-color: ${(props) => props.theme.colors.purple};
    color: #fff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    height: auto;
    margin: 2px 4px 2px 0;
    display: flex;
    cursor: ${(props) => (props.onClick ? 'pointer' : 'default')};
    align-items: center;
    white-space: nowrap;
    font-family: 'Inter';
`

const EditIconContainer = styled.div`
    border: 1px dashed ${(props) => props.theme.colors.lineLightGrey};
    height: 20px;
    width: 20px;
    border-radius: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
`

const EditIcon = styled.div`
    outline: none;
    width: 10px;
    height: 10px;
    background-color: ${(props) => props.theme.colors.purple};
    mask-image: url(${icons.plus});
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 14px;
    cursor: pointer;
    z-index: 10;
`
