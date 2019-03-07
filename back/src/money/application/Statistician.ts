import { Injectable } from '@nestjs/common'
import { groupBy, flow, curryRight, mapValues, flatMap } from 'lodash'

import { dateGroupByCallback } from '@back/utils/infrastructure/dateGroups/dateGroupByCallback'
import { CategoryGroupOutcomeModel } from '@shared/models/money/CategoryGroupOutcomeModel'
import { SourceGroupIncomeModel } from '@shared/models/money/SourceGroupIncomeModel'
import { createGroups } from '@back/utils/infrastructure/dateGroups/createGroups'
import { AverageAmountModel } from '@shared/models/money/AvergaeAmountModel'
import { DateRange } from '@back/utils/infrastructure/dto/DateRange'
import { Currency } from '@shared/enum/Currency'
import { GroupBy } from '@shared/enum/GroupBy'

import { TransactionRepository } from '../domain/interfaces/TransactionRepository'
import { AbstractTransaction } from '../domain/interfaces/AbstarctTransaction'
import { OutcomeRepository } from '../domain/OutcomeRepository'
import { IncomeRepository } from '../domain/IncomeRepository'
import { CurrencyConverter } from './CurrencyConverter'
import { Transaction } from '../domain/dto/Transaction'
import { amountMapper } from './helpers/amountMapper'
import { rangeFilter } from './helpers/rangeFilter'
import { sumReducer } from './helpers/sumReducer'
import { SummedGroup } from './types/SummedGroup'
import { Historian } from './Historian'
import { createAverageReducer } from './helpers/createAverageReducer'

@Injectable()
export class Statistician {
  public constructor(
    private readonly outcomeRepo: OutcomeRepository,
    private readonly incomeRepo: IncomeRepository,
    private readonly converter: CurrencyConverter,
    private readonly historian: Historian,
  ) {}

  public async showAverage(
    userLogin: string,
    statsGroupBy: GroupBy,
    currency: Currency,
  ): Promise<AverageAmountModel[]> {
    const from = await this.historian.getDateOfEarliestTransaction(userLogin)
    const to = new Date()

    const groups = await this.historian.showGroupedHistory(
      userLogin,
      { from, to },
      statsGroupBy,
    )

    const convertedGroups = await Promise.all(
      groups.map(async ({ title, incomes, outcomes }) => ({
        period: new Date(title),
        incomes: await this.convertItems(currency)(incomes),
        outcomes: await this.convertItems(currency)(outcomes),
      })),
    )

    // TODO: refactor it!

    const mapObject = curryRight(mapValues)

    return flow([
      curryRight(groupBy)(group =>
        dateGroupByCallback(statsGroupBy)(group.period),
      ),
      mapObject(groupOfGroups => ({
        incomes: flatMap(groupOfGroups, group =>
          group.incomes.map(amountMapper),
        ),
        outcomes: flatMap(groupOfGroups, group =>
          group.outcomes.map(amountMapper),
        ),
      })),
      mapObject(({ incomes, outcomes }) => ({
        income: incomes.reduce(createAverageReducer(), 0),
        outcome: outcomes.reduce(createAverageReducer(), 0),
      })),
      mapObject(({ income, outcome }) => ({
        income: Math.round(income),
        outcome: Math.round(outcome),
      })),
    ])(convertedGroups)
  }

  public async showDateRangeStats(
    userLogin: string,
    dateRange: DateRange,
    statsGroupBy: GroupBy,
    currency: Currency,
  ) {
    const [incomes, outcomes] = await Promise.all([
      this.incomeRepo.findByRangeForUser(userLogin, dateRange),
      this.outcomeRepo.findByRangeForUser(userLogin, dateRange),
    ])

    const [convertedIncomes, convertedOutcomes] = await Promise.all([
      this.convertItems(currency)(incomes),
      this.convertItems(currency)(outcomes),
    ])

    const groups = createGroups(statsGroupBy)(dateRange)

    return groups.map(group => ({
      currency,
      start: group.from,
      end: group.to,
      income: convertedIncomes
        .filter(rangeFilter(group))
        .map(amountMapper)
        .reduce(sumReducer, 0),
      outcome: convertedOutcomes
        .filter(rangeFilter(group))
        .map(amountMapper)
        .reduce(sumReducer, 0),
    }))
  }

  public async showCategories(
    userLogin: string,
    dateRange: DateRange,
    currency: Currency,
  ): Promise<CategoryGroupOutcomeModel[]> {
    return this.showGrouped(
      userLogin,
      dateRange,
      currency,
      this.outcomeRepo,
      'category',
      'outcome',
    )
  }

  public async showSources(
    userLogin: string,
    dateRange: DateRange,
    currency: Currency,
  ): Promise<SourceGroupIncomeModel[]> {
    return this.showGrouped(
      userLogin,
      dateRange,
      currency,
      this.incomeRepo,
      'source',
      'income',
    )
  }

  private async showGrouped<T extends string, K extends string>(
    userLogin: string,
    dateRange: DateRange,
    currency: Currency,
    repo: TransactionRepository,
    groupKey: T,
    sumKey: K,
  ): Promise<SummedGroup<T, K>[]> {
    const rawTransactions = await repo.findByRangeForUser(userLogin, dateRange)

    const groups = Object.entries(groupBy(rawTransactions, groupKey)).map(
      ([key, transactions]) => ({
        key,
        transactions,
      }),
    )

    const convertedGroups = await Promise.all(
      groups.map(async ({ key, transactions }) => ({
        key,
        transactions: await this.convertItems(currency)(transactions),
      })),
    )

    const summedGroups = convertedGroups.map(
      ({ key, transactions }) =>
        ({
          [groupKey]: key,
          [sumKey]: transactions.map(amountMapper).reduce(sumReducer, 0),
          currency,
        } as SummedGroup<T, K>),
    )

    return summedGroups
  }

  private convertItems(targetCurrency: Currency) {
    return (items: AbstractTransaction[]): Promise<Transaction[]> =>
      Promise.all(
        items.map(async item => {
          const newAmount = await this.converter.convert(
            item.currency,
            targetCurrency,
            item.amount,
            item.date,
          )

          return new Transaction(newAmount, targetCurrency, item.date)
        }),
      )
  }
}
