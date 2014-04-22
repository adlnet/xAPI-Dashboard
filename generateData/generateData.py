#!/bin/env python
import sys, random, json, datetime as dt
from uuid import uuid4
from math import sqrt

random.seed()
nameData = []
with open('names.json','r') as names:
	nameData = json.load(names)

class EST(dt.tzinfo):
	def utcoffset(self, d):
		return dt.timedelta(hours=-5)
	def dst(self, d):
		return dt.timedelta(hours=1)


class Student(object):
	def __init__(self, average, variance):

		self.firstName = random.choice(nameData['firstNames'])
		self.lastName = random.choice(nameData['lastNames'])
		self.name = u'{} {}'.format(self.firstName, self.lastName)
		self.email = u'{}.{}@myschool.edu'.format(self.firstName.lower(), self.lastName.lower())

		self.average = average
		self.variance = variance

	def answerQuestion(self, difficulty):
		return random.normalvariate(self.average,sqrt(self.variance)) >= difficulty


class Class(object):
	def __init__(self, numStudents, classAverage, classVariance, studentVariance):
		self.students = []
		for i in range(numStudents):
			studentAverage = random.normalvariate(classAverage, sqrt(classVariance))
			self.students.append( Student( studentAverage, studentVariance ) )

	def takeTest(self, test):
		results = TestResults(len(test))
		for questionNum,difficulty in enumerate(test):
			for student in self.students:
				results.logAnswer( student, questionNum, student.answerQuestion(difficulty) )

		return results


class Test(list):
	def __init__(self, name, questions):
		self.name = name
		for q in questions:
			self.append(q)


class Battery(object):
	def __init__(self):
		self.tests = []

	def run(self, group):
		result = {}
		for test in self.tests:
			result[test.name] = group.takeTest(test)

		return result


class TestResults(list):
	def __init__(self, numQuestions):
		for i in range(numQuestions):
			self.append({})

	def logAnswer(self, student, questionNumber, success):
		self[questionNumber][student] = success


def genStatements(results):

	xapiStatements = []

	for testid,questions in results.items():

		times = {}
		sums = {}
		try:
			startTime += dt.timedelta(hours=3)
		except UnboundLocalError:
			startTime = dt.datetime.now(EST())

		for qNum,qResults in enumerate(questions):

			for student,result in qResults.items():

				if qNum == 0:
					xapiStatements.append( genStatement(student,'attempted',testid,startTime) )

				activity = '{}/q{}'.format(testid,qNum)
				times[student] = times.get(student, startTime) + dt.timedelta(seconds=random.randint(30,90))
				sums[student] = sums.get(student,0) + (100 if result else 0)

				xapiStatements.append( genStatement(student,'answered',activity,times[student],result) )


		for student,time in times.items():
			xapiStatements.append( genStatement(student,'completed',testid,time) )

			average = sums[student]/len(questions)
			passed = 'passed' if average >= 60 else 'failed'
			xapiStatements.append( genStatement(student,passed,testid,time,average) )

	def sortKey(e):
		return e['stored']
	xapiStatements.sort(key=sortKey, reverse=True)

	return xapiStatements

			
def genStatement(student, verb, activity, time, score=None):
	stmt = {
		'actor': {
			'name': student.name,
			'mbox': 'mailto:'+student.email
		},
		'verb': {
			'id': 'http://adlnet.gov/expapi/verbs/'+verb,
			'display': {'en-US': verb}
		},
		'object': {
			'id': 'http://myschool.edu/xapi_vocab/'+activity,
			'definition': {
				'name': activity
			}
		},

		'authority': {
			'mbox': 'mailto:admin@myschool.edu',
			'objectType': 'Agent'
		},
		'timestamp': time.isoformat(),
		'stored': time.isoformat(),
		'version': '1.0.1',
		'id': str(uuid4())
	}

	if isinstance(score, bool):
		stmt['result'] = {
			'success': score
		}
	elif isinstance(score, (int,long,float)):
		stmt['result'] = {
			'score': {
				'raw': score,
				'min': 0,
				'max': 100
			}
		}
	
	return stmt



def main():

	battery = Battery()
	battery.tests.append( Test('test1', [70 for i in range(100)]) )
	battery.tests.append( Test('test2', [75 for i in range(100)]) )

	myclass = Class(100, 80,10,40)

	results = battery.run(myclass)
	statements = genStatements(results)
	print json.dumps(statements, indent=4)

if __name__ == '__main__':
	main()
