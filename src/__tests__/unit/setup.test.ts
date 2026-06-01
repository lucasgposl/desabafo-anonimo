describe('Project Setup', () => {
  it('should run tests with Jest and TypeScript', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have jsdom environment available', () => {
    expect(document).toBeDefined()
    expect(window).toBeDefined()
  })
})
