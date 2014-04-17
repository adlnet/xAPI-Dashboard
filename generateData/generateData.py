#!/bin/env python
import random, json

random.seed()
nameData = []
with open('names.json','r') as names:
	nameData = json.load(names)


class Class(object):
	def __init__(self, numStudents, classAverage, classDeviation):
		self.students = []
		for i in range(numStudents):
			studentAverage = random.normalvariate(classAverage, classDeviation)
			studentDeviation = 15
			self.students.append( Student( studentAverage, studentDeviation ) )


class Student(object):
	def __init__(self, average, deviation):

		self.firstName = random.choice(nameData['firstNames'])
		self.lastName = random.choice(nameData['lastNames'])
		self.name = '{} {}'.format(self.firstName, self.lastName)
		self.email = '{}.{}@myschool.edu'.format(self.firstName.lower(), self.lastName.lower())

		self.average = average
		self.deviation = deviation

	def answerQuestion(self, difficulty):
		return random.normalvariate(self.average,self.deviation) > difficulty
	

def main():
	student = Student(75,20)
	print student.name, student.email
	for i in range(10):
		print student.answerQuestion(50)

if __name__ == '__main__':
	main()
