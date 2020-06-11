'use strict'

module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.bulkInsert('tipos_transacao', [
        { id: 1, nome: 'RECEITA', created_at: new Date(), updated_at: new Date() },
        { id: 2, nome: 'DESPESA', created_at: new Date(), updated_at: new Date() }
      ], { transaction })

      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      console.error(error)
      throw error
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.bulkDelete('tipos_transacao', {
        id: [1, 2]
      }, { transaction })

      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      console.error(error)
      throw error
    }
  }
}
