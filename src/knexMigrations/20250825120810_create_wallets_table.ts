import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('wallets', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('account_number').unique().notNullable();
    table.decimal('balance', 15, 2).defaultTo(0);
    table.string('currency').defaultTo('NGN');
    table.enum('status', ['active', 'frozen', 'closed']).defaultTo('active');
    table.timestamps(true, true);
    
    table.foreign('user_id').references('id').inTable('users');
  });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('wallets');
}

