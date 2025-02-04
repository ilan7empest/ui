/*
Copyright 2019 Iguazio Systems Ltd.

Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.

In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
import React, { useCallback, useEffect, useRef } from 'react'
import Prism from 'prismjs'
import PropTypes from 'prop-types'
import { useLocation } from 'react-router-dom'

import { PopUpDialog } from 'igz-controls/components'

import './yamlmodal.scss'

const YamlModal = ({ convertedYaml, toggleConvertToYaml }) => {
  const location = useLocation()
  const initialLocationPathnameRef = useRef(null)
  const html = convertedYaml && Prism.highlight(convertedYaml, Prism.languages.yml, 'yml')

  useEffect(() => {
    if (!initialLocationPathnameRef.current) {
      initialLocationPathnameRef.current = location.pathname
    } else if (initialLocationPathnameRef.current !== location.pathname) {
      toggleConvertToYaml()
    }
  }, [convertedYaml, location.pathname, toggleConvertToYaml])

  const outsideClick = useCallback(
    event => {
      if (!event.target.closest('.pop-up-dialog')) {
        toggleConvertToYaml()
      }
    },
    [toggleConvertToYaml]
  )

  useEffect(() => {
    document.addEventListener('click', outsideClick, true)

    return () => {
      document.removeEventListener('click', outsideClick, true)
    }
  }, [outsideClick])

  return (
    <PopUpDialog className="yaml-modal" closePopUp={toggleConvertToYaml}>
      <div data-testid="yaml-modal" className="yaml-modal-container" id="yaml_modal">
        <pre>
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </PopUpDialog>
  )
}

YamlModal.propTypes = {
  convertedYaml: PropTypes.string.isRequired,
  toggleConvertToYaml: PropTypes.func.isRequired
}

export default YamlModal
