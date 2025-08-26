import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email').unique().notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('phone_number').unique().notNullable();
    table.boolean('is_verified').defaultTo(false);
    table.string('password').notNullable();
    table.string('auth_token').nullable();
    table.datetime('token_expiration').nullable();
    table.timestamps(true, true);
  });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('users');
}

