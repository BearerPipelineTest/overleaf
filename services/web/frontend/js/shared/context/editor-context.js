import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import PropTypes from 'prop-types'
import useScopeValue from '../hooks/use-scope-value'
import useBrowserWindow from '../hooks/use-browser-window'
import { useIdeContext } from './ide-context'
import { useProjectContext } from './project-context'
import { useDetachContext } from './detach-context'

export const EditorContext = createContext()

EditorContext.Provider.propTypes = {
  value: PropTypes.shape({
    cobranding: PropTypes.shape({
      logoImgUrl: PropTypes.string.isRequired,
      brandVariationName: PropTypes.string.isRequired,
      brandVariationId: PropTypes.number.isRequired,
      brandId: PropTypes.number.isRequired,
      brandVariationHomeUrl: PropTypes.string.isRequired,
      publishGuideHtml: PropTypes.string,
      partner: PropTypes.string,
      brandedMenu: PropTypes.bool,
      submitBtnHtml: PropTypes.string,
    }),
    hasPremiumCompile: PropTypes.bool,
    loading: PropTypes.bool,
    renameProject: PropTypes.func.isRequired,
    showSymbolPalette: PropTypes.bool,
    toggleSymbolPalette: PropTypes.func,
    insertSymbol: PropTypes.func,
    showGalileo: PropTypes.bool,
    toggleGalileo: PropTypes.func,
    insertGalileoAutocomplete: PropTypes.func,
    insertGalileoCiteAutocomplete: PropTypes.func,
    isProjectOwner: PropTypes.bool,
    isRestrictedTokenMember: PropTypes.bool,
    permissionsLevel: PropTypes.oneOf(['readOnly', 'readAndWrite', 'owner']),
  }),
}

export function EditorProvider({ children, settings }) {
  const ide = useIdeContext()

  const { role } = useDetachContext()

  const { owner, features } = useProjectContext({
    owner: PropTypes.shape({
      _id: PropTypes.string.isRequired,
    }),
    features: PropTypes.shape({
      compileGroup: PropTypes.string,
    }),
  })

  const cobranding = useMemo(() => {
    if (window.brandVariation) {
      return {
        logoImgUrl: window.brandVariation.logo_url,
        brandVariationName: window.brandVariation.name,
        brandVariationId: window.brandVariation.id,
        brandId: window.brandVariation.brand_id,
        brandVariationHomeUrl: window.brandVariation.home_url,
        publishGuideHtml: window.brandVariation.publish_guide_html,
        partner: window.brandVariation.partner,
        brandedMenu: window.brandVariation.branded_menu,
        submitBtnHtml: window.brandVariation.submit_button_html,
      }
    } else {
      return undefined
    }
  }, [])

  const [loading] = useScopeValue('state.loading')
  const [projectName, setProjectName] = useScopeValue('project.name')
  const [permissionsLevel] = useScopeValue('permissionsLevel')
  const [showSymbolPalette] = useScopeValue('editor.showSymbolPalette')
  const [toggleSymbolPalette] = useScopeValue('editor.toggleSymbolPalette')
  const [showGalileo] = useScopeValue('editor.showGalileo')
  const [toggleGalileo] = useScopeValue('editor.toggleGalileo')

  useEffect(() => {
    if (ide?.socket) {
      ide.socket.on('projectNameUpdated', setProjectName)
      return () =>
        ide.socket.removeListener('projectNameUpdated', setProjectName)
    }
  }, [ide?.socket, setProjectName])

  const renameProject = useCallback(
    newName => {
      setProjectName(oldName => {
        if (oldName !== newName) {
          settings.saveProjectSettings({ name: newName }).catch(response => {
            setProjectName(oldName)
            const { data, status } = response
            if (status === 400) {
              return ide.showGenericMessageModal('Error renaming project', data)
            } else {
              return ide.showGenericMessageModal(
                'Error renaming project',
                'Please try again in a moment'
              )
            }
          })
        }
        return newName
      })
    },
    [settings, ide, setProjectName]
  )

  const { setTitle } = useBrowserWindow()
  useEffect(() => {
    const parts = []

    if (role === 'detached') {
      parts.push('[PDF]')
    }

    if (projectName) {
      parts.push(projectName)
      parts.push('-')
    }

    parts.push('Online LaTeX Editor')
    parts.push(window.ExposedSettings.appName)

    const title = parts.join(' ')

    setTitle(title)
  }, [projectName, setTitle, role])

  const insertSymbol = useCallback(symbol => {
    window.dispatchEvent(
      new CustomEvent('editor:insert-symbol', {
        detail: symbol,
      })
    )
  }, [])

  const insertGalileoAutocomplete = useCallback(text => {
    window.dispatchEvent(
      new CustomEvent('editor:insert-galileo-completion', {
        detail: { text, cite: false },
      })
    )
  }, [])

  const insertGalileoCiteAutocomplete = useCallback(text => {
    window.dispatchEvent(
      new CustomEvent('editor:insert-galileo-completion', {
        detail: { text, cite: true },
      })
    )
  }, [])

  const value = useMemo(
    () => ({
      cobranding,
      hasPremiumCompile: features?.compileGroup === 'priority',
      loading,
      renameProject,
      permissionsLevel,
      isProjectOwner: owner?._id === window.user.id,
      isRestrictedTokenMember: window.isRestrictedTokenMember,
      showSymbolPalette,
      toggleSymbolPalette,
      insertSymbol,
      showGalileo,
      toggleGalileo,
      insertGalileoAutocomplete,
      insertGalileoCiteAutocomplete,
    }),
    [
      cobranding,
      features?.compileGroup,
      loading,
      renameProject,
      permissionsLevel,
      owner?._id,
      showSymbolPalette,
      toggleSymbolPalette,
      insertSymbol,
      showGalileo,
      toggleGalileo,
      insertGalileoAutocomplete,
      insertGalileoCiteAutocomplete,
    ]
  )

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  )
}

EditorProvider.propTypes = {
  children: PropTypes.any,
  settings: PropTypes.object,
}

export function useEditorContext(propTypes) {
  const context = useContext(EditorContext)

  if (!context) {
    throw new Error('useEditorContext is only available inside EditorProvider')
  }

  PropTypes.checkPropTypes(propTypes, context, 'data', 'EditorContext.Provider')

  return context
}
