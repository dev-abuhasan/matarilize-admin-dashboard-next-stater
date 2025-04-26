// MUI Imports
import type { Theme } from '@mui/material/styles'

import { horizontalNavClasses } from '@menu/utils/menuClasses'

const menuRootStyles = (theme: Theme) => {
  return {
    [`.${horizontalNavClasses.root}:has(&)`]: {
      padding: theme.spacing(2),
      margin: theme.spacing(-2)
    },
    '& > ul': {
      padding: theme.spacing(2),
      margin: theme.spacing(-2),
      '& > li:not(:last-of-type)': {
        marginInlineEnd: theme.spacing(1)
      }
    }
  }
}

export default menuRootStyles
