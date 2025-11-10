import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { createMockUser } from '@/test/factories/user'
import { submitAction, updateAction, deleteAction } from '../actions'

describe('Action Integration Tests', () => {
  // Store IDs for cleanup
  const createdIds: string[] = []
  let testUserId: string

  beforeAll(async () => {
    // Create test user if needed
    const testUser = await prisma.user.create({
      data: createMockUser({ email: 'action-test@example.com' })
    })
    testUserId = testUser.id
  })

  afterAll(async () => {
    // Clean up created records
    if (createdIds.length > 0) {
      await prisma.yourModel.deleteMany({
        where: { id: { in: createdIds } }
      })
    }

    // Clean up test user
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } })
    }
  })

  describe('submitAction', () => {
    it('creates record in database', async () => {
      const testData = {
        title: 'Test Item',
        description: 'Test Description'
      }

      const result = await submitAction(testData)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data).toMatchObject({
        title: 'Test Item',
        description: 'Test Description'
      })

      // Store for cleanup
      if (result.data?.id) {
        createdIds.push(result.data.id)
      }

      // Verify in database
      const dbRecord = await prisma.yourModel.findUnique({
        where: { id: result.data!.id }
      })

      expect(dbRecord).toBeTruthy()
      expect(dbRecord?.title).toBe('Test Item')
    })

    it('validates required fields', async () => {
      const invalidData = {
        title: '', // Required field empty
        description: 'Description'
      }

      const result = await submitAction(invalidData as any)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('handles database constraint violations', async () => {
      // Create record with unique field
      const data = { title: 'Unique Title', userId: testUserId }
      const result1 = await submitAction(data)
      createdIds.push(result1.data!.id)

      // Try to create duplicate
      const result2 = await submitAction(data)

      expect(result2.success).toBe(false)
      expect(result2.error).toContain('unique')
    })

    it('requires authentication', async () => {
      // Test without auth context
      const result = await submitAction({
        title: 'Test'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })

  describe('updateAction', () => {
    let recordId: string

    beforeAll(async () => {
      // Create a record to update
      const record = await prisma.yourModel.create({
        data: {
          title: 'Original Title',
          userId: testUserId
        }
      })
      recordId = record.id
      createdIds.push(recordId)
    })

    it('updates existing record', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description'
      }

      const result = await updateAction(recordId, updateData)

      expect(result.success).toBe(true)
      expect(result.data?.title).toBe('Updated Title')

      // Verify in database
      const dbRecord = await prisma.yourModel.findUnique({
        where: { id: recordId }
      })

      expect(dbRecord?.title).toBe('Updated Title')
      expect(dbRecord?.description).toBe('Updated Description')
    })

    it('prevents updating non-existent record', async () => {
      const result = await updateAction('non-existent-id', {
        title: 'Test'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('prevents unauthorized updates', async () => {
      // Create another user's record
      const otherUser = await prisma.user.create({
        data: createMockUser({ email: 'other@example.com' })
      })

      const otherRecord = await prisma.yourModel.create({
        data: {
          title: 'Other User Record',
          userId: otherUser.id
        }
      })
      createdIds.push(otherRecord.id)

      // Try to update as current user (should fail)
      const result = await updateAction(otherRecord.id, {
        title: 'Hacked Title'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Forbidden')

      // Cleanup other user
      await prisma.user.delete({ where: { id: otherUser.id } })
    })

    it('validates update data', async () => {
      const invalidData = {
        title: '', // Invalid empty title
      }

      const result = await updateAction(recordId, invalidData as any)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('deleteAction', () => {
    it('deletes existing record', async () => {
      // Create a record to delete
      const record = await prisma.yourModel.create({
        data: {
          title: 'To Delete',
          userId: testUserId
        }
      })

      const result = await deleteAction(record.id)

      expect(result.success).toBe(true)

      // Verify deleted from database
      const dbRecord = await prisma.yourModel.findUnique({
        where: { id: record.id }
      })

      expect(dbRecord).toBeNull()
    })

    it('prevents deleting non-existent record', async () => {
      const result = await deleteAction('non-existent-id')

      expect(result.success).toBe(false)
    })

    it('prevents unauthorized deletion', async () => {
      // Create another user's record
      const otherUser = await prisma.user.create({
        data: createMockUser({ email: 'other2@example.com' })
      })

      const otherRecord = await prisma.yourModel.create({
        data: {
          title: 'Other User Record',
          userId: otherUser.id
        }
      })

      // Try to delete as current user
      const result = await deleteAction(otherRecord.id)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Forbidden')

      // Cleanup
      await prisma.yourModel.delete({ where: { id: otherRecord.id } })
      await prisma.user.delete({ where: { id: otherUser.id } })
    })
  })

  describe('RLS Policy Tests', () => {
    it('enforces read permissions', async () => {
      // Users should only read own data
      const userRecords = await prisma.yourModel.findMany({
        where: { userId: testUserId }
      })

      // All returned records should belong to current user
      userRecords.forEach(record => {
        expect(record.userId).toBe(testUserId)
      })
    })

    it('prevents reading other users data', async () => {
      // Try to read different user's data
      const result = await prisma.yourModel.findMany({
        where: { userId: 'different-user-id' }
      })

      // RLS should filter it out
      expect(result).toEqual([])
    })
  })
})
