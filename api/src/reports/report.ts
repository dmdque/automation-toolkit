export interface IReportConfiguration<T> {
  models: T[];
  columns: IReportColumn<T>[];
  label: string;
}

export interface IReportColumn<T> {
  header: string;
  getElement: (model: T) => string;
}

export abstract class Report<T> {
  public async generate() {
    const config = await this.getConfig();
    let content = `${config.columns.map(c => c.header).join(',')}\n`;

    config.models.forEach((m, i) => {
      content += `${config.columns.map(c => c.getElement(m))}`;
      if (i !== config.models.length - 1) {
        content += '\n';
      }
    });

    return content;
  }

  protected abstract getConfig(): Promise<IReportConfiguration<T>>;
}
