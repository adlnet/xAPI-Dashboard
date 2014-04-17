#!/bin/env python
import random, json

random.seed()
nameData = []
with open('names.json','r') as names:
	nameData = json.load(names)



class Student(object):
	def __init__(self, average, deviation):

		self.firstName = random.choice(nameData['firstNames'])
		self.lastName = random.choice(nameData['lastNames'])
		self.name = '{} {}'.format(self.firstName, self.lastName)
		self.email = '{}.{}@myschool.edu'.format(self.firstName.lower(), self.lastName.lower())

		self.average = average
		self.deviation = deviation

	def __hash__(self):
		return self.email

	def __eq__(self, other):
		return hash(self) == hash(other)

	def answerQuestion(self, difficulty):
		return random.normalvariate(self.average,self.deviation) > difficulty



class Class(object):
	def __init__(self, numStudents, classAverage, classDeviation):
		self.students = []
		for i in range(numStudents):
			studentAverage = random.normalvariate(classAverage, classDeviation)
			studentDeviation = 15
			self.students.append( Student( studentAverage, studentDeviation ) )

	def takeTest(self, testId, questionDifficulties):
		results = TestResults(testId, len(questionDifficulties))
		for q,d in enumerate(questionDifficulties):
			for s in self.students:
				results.logAnswer( s, q, s.answerQuestion(d) )

		return results


class TestResults(object):
	def __init__(self, testId, numQuestions):
		self.testId = testId
		self.questionResults = [{} for i in range(numQuestions)]

	def logAnswer(self, student, questionNumber, success):
		self.questionResults[questionNumber][student] = success



def main():
	#student = Student(75,20)
	#print student.name, student.email
	#for i in range(10):
	#	print student.answerQuestion(50)
	myclass = Class(10, 85, 20)
	results = myclass.takeTest('test1', [25,25,25,50,50,50])
	print results.questionResults

if __name__ == '__main__':
	main()
