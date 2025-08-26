import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('transactions', (table) => {
        table.increments('id').primary();
        table.integer('sender_id').unsigned().nullable();
        table.integer('receiver_id').unsigned().notNullable();
        table.enum('transaction_type', ['credit', 'debit']).notNullable();
        table.decimal('amount', 15, 2).notNullable();
        table.string('description').nullable();
        table.enum('status', ['pending', 'completed', 'failed']).defaultTo('pending');
        table.timestamps(true, true);
        
        
        table.foreign('sender_id').references('id').inTable('users');
        table.foreign('receiver_id').references('id').inTable('users');
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('transactions');
}