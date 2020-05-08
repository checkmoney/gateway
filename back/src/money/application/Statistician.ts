import { Injectable } from '@nestjs/common';
import { groupBy, mapValues } from 'lodash';

import { createGroups } from '&back/utils/infrastructure/dateGroups/createGroups';
import { dateGroupByCallback } from '&back/utils/infrastructure/dateGroups/dateGroupByCallback';
import { prevDate } from '&back/utils/infrastructure/dateGroups/prevDate';
import { DateRange } from '&back/utils/infrastructure/dto/DateRange';
import { Currency } from '&shared/enum/Currency';
import { GroupBy } from '&shared/enum/GroupBy';
import { createAverageReducer } from '&shared/helpers/createAverageReducer';
import { AverageAmountModel } from '&shared/models/money/AvergaeAmountModel';

import { Transaction } from '../domain/dto/Transaction';
import { IncomeRepository } from '../domain/IncomeRepository';
import { AbstractTransaction } from '../domain/interfaces/AbstarctTransaction';
import { OutcomeRepository } from '../domain/OutcomeRepository';
import { CurrencyConverter } from './CurrencyConverter';
import { amountMapper } from './helpers/amountMapper';
import { rangeFilter } from './helpers/rangeFilter';
import { sumReducer } from './helpers/sumReducer';
import { Historian } from './Historian';

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
    const from = await this.historian.getDateOfEarliestTransaction(userLogin);
    const to = prevDate(statsGroupBy); // to exclude current period

    const groups = await this.historian.showGroupedHistory(
      userLogin,
      { from, to },
      statsGroupBy,
    );

    const convertedGroups = await Promise.all(
      groups.map(async ({ title, incomes, outcomes }) => ({
        period: new Date(title),
        incomes: await this.convertItems(currency)(incomes),
        outcomes: await this.convertItems(currency)(outcomes),
      })),
    );

    const summedGroups = convertedGroups.map(
      ({ incomes, outcomes, period }) => ({
        period,
        income: incomes.map(amountMapper).reduce(sumReducer, 0),
        outcome: outcomes.map(amountMapper).reduce(sumReducer, 0),
      }),
    );

    const groupedGroups = mapValues(
      groupBy(summedGroups, group =>
        dateGroupByCallback(statsGroupBy)(group.period),
      ),
      (values, period) => ({
        period,
        income: values
          .map(group => group.income)
          .filter(Boolean)
          .reduce(createAverageReducer(), 0),
        outcome: values
          .map(group => group.outcome)
          .filter(Boolean)
          .reduce(createAverageReducer(), 0),
      }),
    );

    return Object.values(groupedGroups).map(group => ({
      ...group,
      currency,
    }));
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
    ]);

    const [convertedIncomes, convertedOutcomes] = await Promise.all([
      this.convertItems(currency)(incomes),
      this.convertItems(currency)(outcomes),
    ]);

    const groups = createGroups(statsGroupBy)(dateRange);

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
    }));
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
          );

          return new Transaction(newAmount, targetCurrency, item.date);
        }),
      );
  }
}
