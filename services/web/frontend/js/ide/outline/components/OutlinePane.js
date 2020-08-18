import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import classNames from 'classnames'
import OutlineRoot from './OutlineRoot'
import localStorage from '../../../modules/localStorage'

function OutlinePane({
  isTexFile,
  outline,
  projectId,
  jumpToLine,
  onToggle,
  eventTracking,
  highlightedLine
}) {
  const storageKey = `file_outline.expanded.${projectId}`
  const [expanded, setExpanded] = useState(() => {
    const storedExpandedState = localStorage(storageKey) !== false
    return storedExpandedState
  })
  const isOpen = isTexFile && expanded

  useEffect(
    () => {
      onToggle(isOpen)
    },
    [isOpen]
  )

  const expandCollapseIconClasses = classNames('fa', 'outline-caret-icon', {
    'fa-angle-down': isOpen,
    'fa-angle-right': !isOpen
  })

  const headerClasses = classNames('outline-pane', {
    'outline-pane-disabled': !isTexFile
  })

  function handleExpandCollapseClick() {
    if (isTexFile) {
      localStorage(storageKey, !expanded)
      eventTracking.sendMB(expanded ? 'outline-collapse' : 'outline-expand')
      setExpanded(!expanded)
    }
  }

  return (
    <div className={headerClasses}>
      <header className="outline-header">
        <button
          className="outline-header-expand-collapse-btn"
          disabled={!isTexFile}
          onClick={handleExpandCollapseClick}
        >
          <i className={expandCollapseIconClasses} />
          <h4 className="outline-header-name">File outline</h4>
          {expanded ? (
            <OverlayTrigger placement="top" overlay={tooltip} delayHide={100}>
              <a
                href="https://forms.gle/8N1iSS9rkgmpFDHY6"
                target="_blank"
                rel="noopener noreferrer"
                className="outline-header-info-badge"
                onClick={ev => ev.stopPropagation()}
              >
                <span className="sr-only">{infoContent}</span>
              </a>
            </OverlayTrigger>
          ) : null}
        </button>
      </header>
      {expanded && isTexFile ? (
        <div className="outline-body">
          <OutlineRoot
            outline={outline}
            jumpToLine={jumpToLine}
            highlightedLine={highlightedLine}
          />
        </div>
      ) : null}
    </div>
  )
}

const infoContent = (
  <>
    The <strong>File outline</strong> is a new feature. Click the icon to give
    feedback.
  </>
)
const tooltip = <Tooltip id="outline-info-tooltip">{infoContent}</Tooltip>

OutlinePane.propTypes = {
  isTexFile: PropTypes.bool.isRequired,
  outline: PropTypes.array.isRequired,
  projectId: PropTypes.string.isRequired,
  jumpToLine: PropTypes.func.isRequired,
  onToggle: PropTypes.func,
  eventTracking: PropTypes.object.isRequired,
  highlightedLine: PropTypes.number
}

export default OutlinePane
