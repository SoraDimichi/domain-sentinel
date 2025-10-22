import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateDomainWarningFeedTable1684654321002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'domain_warning_feed',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'domain_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'has_warning',
            type: 'boolean',
            default: false,
          },
          {
            name: 'browser_type',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('domain_warning_feed');
  }
}
