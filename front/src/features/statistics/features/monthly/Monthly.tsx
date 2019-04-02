import { endOfYear, format, startOfYear, getYear, parse } from 'date-fns'
import { useState, useMemo } from 'react'
import { useMappedState } from 'redux-react-hook'
import { useMedia } from 'use-media'

import { fetchStatsDynamics } from '@front/domain/money/actions/fetchStatsDynamics'
import { getStatsDynamics } from '@front/domain/money/selectors/getStatsDynamics'
import { getStatsDynamicsFetchingStatus } from '@front/domain/money/selectors/getStatsDynamicsFetchingStatus'
import { useMemoState } from '@front/domain/store'
import { displayMoney } from '@shared/helpers/displayMoney'
import { BarChart } from '@front/ui/components/chart/bar-chart'
import { Loader } from '@front/ui/components/layout/loader'
import { Currency } from '@shared/enum/Currency'
import { GroupBy } from '@shared/enum/GroupBy'
import { ControlHeader } from '@front/ui/components/controls/control-header'
import { YearPicker } from '@front/ui/components/form/year-picker'
import { getFirstTransactionDate } from '@front/domain/money/selectors/getFirstTransactionDate'
import { wantUTC } from '@front/helpers/wantUTC'

const groupBy = GroupBy.Month

interface Props {
  className?: string
  currency: Currency
}

export const Monthly = ({ className, currency }: Props) => {
  const firstTransactionDate = useMappedState(getFirstTransactionDate)
  const fetching = useMappedState(getStatsDynamicsFetchingStatus)
  const isSmall = useMedia({ maxWidth: 768 })

  const [year, setYear] = useState(getYear(new Date()))

  const [from, to] = useMemo(() => {
    const date = parse(`${year}-01-01`)

    return [wantUTC(startOfYear)(date), wantUTC(endOfYear)(date)]
  }, [year])

  const stats = useMemoState(
    () => getStatsDynamics(from, to, groupBy, currency),
    () => fetchStatsDynamics(from, to, groupBy, currency),
    [from, to, currency],
  )

  return (
    <section className={className}>
      <ControlHeader title="Monthly dynamics in">
        <YearPicker
          min={getYear(firstTransactionDate)}
          value={year}
          onChange={d => setYear(d || getYear(new Date()))}
        />
      </ControlHeader>

      <Loader status={fetching}>
        {stats.nonEmpty() && (
          <BarChart
            displayValue={displayMoney(currency)}
            dataSets={stats.get().map(({ start, income, outcome }) => ({
              name: format(start, 'MMMM'),
              data: {
                income,
                outcome,
              },
            }))}
            fitToContainer={isSmall}
          />
        )}
      </Loader>
    </section>
  )
}