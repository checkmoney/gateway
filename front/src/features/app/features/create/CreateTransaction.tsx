import { useCallback, useEffect } from 'react'
import { Form } from 'react-final-form'
import { useMappedState } from 'redux-react-hook'

import { getCreateOutcomeFetching } from '@front/domain/money/selectors/getCreateOutcomeFetching'
import { useThunk } from '@front/domain/store'
import {
  DatePicker,
  EnumSelect,
  InputMoney,
  Toggle,
  AutoComplete,
} from '@front/features/final-form'
import { getCurrencyName } from '@shared/helpers/getCurrencyName'
import { Label } from '@front/ui/components/form/label'
import { LoadingButton } from '@front/ui/components/form/loading-button'
import { Card } from '@front/ui/components/layout/card'
import { Currency } from '@shared/enum/Currency'
import { Variant } from '@front/ui/components/form/toggle/Variant'
import { getCreateIncomeFetching } from '@front/domain/money/selectors/getCreateIncomeFetching'
import { mergeFetchingState } from '@front/helpers/mergeFetchingState'

import * as styles from './CreateTransaction.css'
import { Kind } from './helpers/Kind'
import { getCommentByKind } from './helpers/getCommentByKind'
import { getExampleByKind } from './helpers/getExampleByKind'
import { getSources } from '@front/domain/money/selectors/getSources'
import { fetchSources } from '@front/domain/money/actions/fetchSources'
import { getCategories } from '@front/domain/money/selectors/getCategories'
import { fetchCategories } from '@front/domain/money/actions/fetchCategories'
import { useOnSubmit } from './helpers/useOnSubmit'

interface Props {
  className?: string
}

export const CreateTransaction = ({ className }: Props) => {
  const dispatch = useThunk()

  const onSubmit = useOnSubmit()

  const outcomeFetching = useMappedState(getCreateOutcomeFetching)
  const incomeFetching = useMappedState(getCreateIncomeFetching)
  const fetching = mergeFetchingState(outcomeFetching, incomeFetching)

  const existSources = useMappedState(getSources)
  const existCategories = useMappedState(getCategories)
  useEffect(() => {
    dispatch(fetchSources())
    dispatch(fetchCategories())
  }, [])

  const getVariants = useCallback(
    (kind: Kind) =>
      ({
        [Kind.Income]: existSources,
        [Kind.Outcome]: existCategories,
      }[kind]),
    [existSources, existCategories],
  )

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={{
        currency: Currency.RUB,
        date: new Date(),
        kind: Kind.Income,
      }}
    >
      {({ handleSubmit, form: { initialize }, values, initialValues }) => (
        <form
          onSubmit={e => handleSubmit(e)!.then(() => initialize(initialValues))}
          className={className}
        >
          <Card title="Create new transaction" className={styles.form}>
            <Label text="Amount" className={styles.amount}>
              <InputMoney name="amount" currency={values.currency} />
            </Label>

            <Label
              text={getCommentByKind(values.kind)}
              className={styles.comment}
            >
              <AutoComplete
                name="comment"
                placeholder={getExampleByKind(values.kind)}
                variants={getVariants(values.kind)}
              />
            </Label>

            <Label text="Currency" className={styles.currency}>
              <EnumSelect
                showSearch
                name="currency"
                options={Currency}
                getLabel={getCurrencyName}
              />
            </Label>

            <Label text="Date" className={styles.date}>
              <DatePicker name="date" />
            </Label>

            <Toggle name="kind" className={styles.kind}>
              <Variant value={Kind.Outcome}>Outcome</Variant>
              <Variant value={Kind.Income}>Income</Variant>
            </Toggle>

            <LoadingButton fethcing={fetching} submit className={styles.submit}>
              Create
            </LoadingButton>
          </Card>
        </form>
      )}
    </Form>
  )
}