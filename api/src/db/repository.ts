import * as Datastore from 'nedb';
import { config } from '../config';

export interface IStoredModel {
  _id: string;
}

export interface IFindOptions<T> {
  sort?: {
    key: keyof T;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  skip?: number;
}

export type StoredModel<T> = IStoredModel & T;

export interface IRepository<T, S extends StoredModel<T>> {
  create(data: T): Promise<S>;
  find(data: Partial<S>, options?: IFindOptions<T>): Promise<S[]>;
  findOne(data: Partial<S>): Promise<S | undefined>;
  update(query: Partial<S>, data: T): Promise<number>;
  count(query: Partial<T>): Promise<number>;
  delete(query: Partial<S>): Promise<number>;
}

export abstract class Repository<T, S extends StoredModel<T>> implements IRepository<T, S> {
  private readonly datastore: Datastore;

  constructor() {
    const directory = process.env.NODE_ENV === 'test' ? 'test-data' : 'data';

    this.datastore = new Datastore({
      filename: `./${directory}/${this.constructor.name.toLowerCase().replace('repository', '')}.db`,
      autoload: true
    });
  }

  public async create(data: T) {
    return new Promise<S>((resolve, reject) => {
      this.datastore.insert(data, (err, doc: S) => {
        if (err) { return reject(err); }
        resolve(doc);
      });
    });
  }

  public async find(data: Partial<S>, options?: IFindOptions<T>) {
    return new Promise<S[]>((resolve, reject) => {
      let cursor = this.datastore.find(data);
      if (options) {
        if (options.sort) {
          const sortParams: any = {};
          sortParams[options.sort.key] = options.sort.direction === 'asc' ? 1 : -1;
          cursor = cursor.sort(sortParams);
        }

        if (options.skip) {
          cursor = cursor.skip(options.skip);
        }

        if (options.limit) {
          cursor = cursor.limit(options.limit);
        }
      }

      cursor.exec((err: Error, doc: S[]) => {
        if (err) { return reject(err); }
        resolve(doc);
      });
    });
  }

  public async findOne(data: Partial<S>) {
    return new Promise<S | undefined>((resolve, reject) => {
      this.datastore.findOne(data, (err: Error, doc: S) => {
        if (err) { return reject(err); }
        resolve(doc ? doc : undefined);
      });
    });
  }

  public async update(query: Partial<S>, data: T) {
    return new Promise<number>((resolve, reject) => {
      this.datastore.update(query, data, {}, (err: Error, numReplaced) => {
        if (err) { return reject(err); }
        resolve(numReplaced);
      });
    });
  }

  public async count(query: Partial<T>) {
    return new Promise<number>((resolve, reject) => {
      this.datastore.count(query, (err: Error, count: number) => {
        if (err) { return reject(err); }
        resolve(count);
      });
    });
  }

  public async delete(query: Partial<S>) {
    return new Promise<number>((resolve, reject) => {
      this.datastore.remove(query, (err: Error, numDeleted) => {
        if (err) { return reject(err); }
        resolve(numDeleted);
      });
    });
  }
}
