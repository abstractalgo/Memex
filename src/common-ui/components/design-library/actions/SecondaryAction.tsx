import React from 'react'
import styled from 'styled-components'
import {
    colorMidPurple,
    colorWhite,
} from 'src/common-ui/components/design-library/colors'
import {
    fontSizeSmall,
    TypographyActionText,
} from 'src/common-ui/components/design-library/typography'

const StyledSecondaryAction = styled.div`
    padding: 8px 20px;
    border: ${(props) => !props.borderOff && `1px solid ${colorMidPurple}`};
    box-sizing: border-box;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    height: 35px;
    white-space: nowrap;
    vertical-align: middle;
    align-items: center;
    justify-content: center;

    &: hover {
        background-color: ${colorMidPurple}30;
    }
`
const StyledSecondaryActionLinkText = styled(TypographyActionText)`
    font-size: ${fontSizeSmall}px;
    color: ${colorMidPurple};
`
export const SecondaryAction = ({
    label,
    onClick,
    disabled,
    borderOff,
}: {
    label: React.ReactNode
    disabled?: boolean
    onClick: React.MouseEventHandler
    borderOff?: boolean
}) => (
    <StyledSecondaryAction
        onClick={disabled === true ? undefined : onClick}
        disabled={disabled}
        borderOff={borderOff}
    >
        <StyledSecondaryActionLinkText>{label}</StyledSecondaryActionLinkText>
    </StyledSecondaryAction>
)
