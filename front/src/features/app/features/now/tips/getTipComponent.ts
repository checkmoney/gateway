import { TipModel } from '@shared/models/mind/TipModel'
import { TipAction } from '@shared/enum/TipAction'

import { MergeSources } from './merge-sources'
import { MergeCategories } from './merge-categories'
import { ComponentType } from 'react'

interface Props {
  tip: TipModel
}

export const getTipComponent = (tip: TipModel): ComponentType<Props> =>
  ({
    [TipAction.MergeSources]: MergeSources,
    [TipAction.MergeCategories]: MergeCategories,
  }[tip.action])